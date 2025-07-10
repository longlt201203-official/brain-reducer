import * as vscode from "vscode";
import { BasePannel } from "./base-pannel";
import * as path from "path";
import * as fs from "fs";
import { ChatSession } from "../sessions";
import { AiService } from "../services";
import { concat } from "@langchain/core/utils/stream";
import { AIMessage, AIMessageChunk, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { SetApiKeyCommand } from "../commands";
import { ToolsManager } from "../tools";

export class ChatViewPannel extends BasePannel {
  private readonly chatSession: ChatSession;
  private readonly aiService: AiService;
  constructor(context: vscode.ExtensionContext) {
    super(context, "chat-view", "AI Chat", vscode.ViewColumn.Two, {
      localResourceRoots: [context.extensionUri],
      enableScripts: true,
      retainContextWhenHidden: true
    });
    this.loadModel();

    this.chatSession = new ChatSession(context);
    this.aiService = AiService.getInstance();
  }

  getHtmlForWebview(webview: vscode.Webview): string {
    const extensionUri = this.context.extensionUri;
    const htmlPath = path.join(
      extensionUri.fsPath,
      "views",
      "chat-view",
      "index.html"
    );
    let htmlContent = fs.readFileSync(htmlPath, "utf-8");
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "views", "chat-view", "index.css")
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "views", "chat-view", "index.js")
    );
    htmlContent = htmlContent.replace("{{cssUri}}", cssUri.toString());
    htmlContent = htmlContent.replace("{{jsUri}}", jsUri.toString());
    htmlContent = this.loadBootstrap(webview, htmlContent);
    htmlContent = this.loadHighlightJS(webview, htmlContent);
    htmlContent = this.loadMarkedJS(webview, htmlContent);
    return htmlContent;
  }

  handleChangeViewState(e: vscode.WebviewPanelOnDidChangeViewStateEvent): void {
    if (e.webviewPanel.visible && e.webviewPanel.active) {
      // When the panel becomes visible and active, we can send the initial chat session data
      // this.pannel.webview.postMessage({
      //   type: "load-chat-session",
      //   data: this.chatSession.getJSONMessageList(),
      // });
      this.loadModel();
    }
  }

  handleDidDispose(): void { }

  private loadBootstrap(webview: vscode.Webview, htmlContent: string) {
    const extensionUri = this.context.extensionUri;
    const bootstrapCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        extensionUri,
        "views",
        "chat-view",
        "bootstrap",
        "css",
        "bootstrap.min.css"
      )
    );
    const bootstrapJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        extensionUri,
        "views",
        "chat-view",
        "bootstrap",
        "js",
        "bootstrap.bundle.min.js"
      )
    );
    htmlContent = htmlContent.replace(
      "{{bootstrapCssUri}}",
      bootstrapCssUri.toString()
    );
    htmlContent = htmlContent.replace(
      "{{bootstrapJsUri}}",
      bootstrapJsUri.toString()
    );
    return htmlContent;
  }

  private loadHighlightJS(webview: vscode.Webview, htmlContent: string) {
    const extensionUri = this.context.extensionUri;
    const hljsCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        extensionUri,
        "views",
        "chat-view",
        "hljs",
        "hljs.css"
      )
    );
    const hljsJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "views", "chat-view", "hljs", "hljs.js")
    );
    htmlContent = htmlContent.replace("{{hljsCssUri}}", hljsCssUri.toString());
    htmlContent = htmlContent.replace("{{hljsJsUri}}", hljsJsUri.toString());
    return htmlContent;
  }

  private loadMarkedJS(webview: vscode.Webview, htmlContent: string) {
    const extensionUri = this.context.extensionUri;
    const markedJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        extensionUri,
        "views",
        "chat-view",
        "marked",
        "marked.js"
      )
    );
    const markedHighlightJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        extensionUri,
        "views",
        "chat-view",
        "marked",
        "marked-highlight.js"
      )
    );
    htmlContent = htmlContent.replace(
      "{{markedJsUri}}",
      markedJsUri.toString()
    );
    htmlContent = htmlContent.replace(
      "{{markedHighlightJsUri}}",
      markedHighlightJsUri.toString()
    );
    return htmlContent;
  }

  private loadModel() {
    this.pannel.webview.postMessage({
      type: "load-model",
      data: vscode.workspace
        .getConfiguration("brainReducer")
        .get<string>("model", "gemini-2.0-flash"),
    })
  }

  messageHandler(message: any) {
    switch (message.type) {
      case "send-message":
        this.handleSendMessage(message.data);
        break;
      case "set-model":
        this.handleSetModel(message.data);
        break;
    }
  }

  private async handleSendMessage(data: any) {
    console.log(data)

    try {
      this.chatSession.addMessage(
        new HumanMessage({
          content: [
            {
              type: "text",
              text: data.content,
            },
            ...data.images.map((base64Image: string) => ({
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            })),
          ],
        })
      );
      const toolsMap = ToolsManager.getInstance().ToolsMap;
      let done = false;
      this.pannel.webview.postMessage({
        type: "init-ai-message",
      });

      console.log("Start processing");
      let aiMessageChunk: AIMessageChunk | undefined = undefined;
      while (!done) {
        done = true;
        console.log("Iteration");
        if (aiMessageChunk != undefined && aiMessageChunk.tool_calls && aiMessageChunk.tool_calls.length > 0) {
          for (const toolCall of aiMessageChunk.tool_calls) {
            console.log(toolCall.args);
            const selectedTool = toolsMap[toolCall.name];
            if (selectedTool) {
              this.pannel.webview.postMessage({
                type: "ai-message-chunk",
                data: `\n\n${selectedTool.getMessage(toolCall.args)}\n\n`
              });
              const toolMessage: ToolMessage = await selectedTool.Tool.invoke(
                toolCall
              );
              this.chatSession.addMessage(toolMessage);
            }
          }
          aiMessageChunk = undefined;
        }

        let stream = await this.aiService.promptForAnswer(
          data.model,
          this.chatSession,
          data.searchInternet
        );
        for await (const chunk of stream) {
          aiMessageChunk = aiMessageChunk == undefined ? chunk : concat(aiMessageChunk, chunk);

          if (chunk.content) {
            const contentFragment =
              typeof chunk.content == "string"
                ? chunk.content
                : chunk.content.length > 0 && chunk.content[0].type == "text"
                  ? chunk.content[0].text
                  : "";
            if (contentFragment) {
              this.pannel.webview.postMessage({
                type: "ai-message-chunk",
                data: contentFragment,
              });
            }
          }
        }

        if (aiMessageChunk != undefined) {
          this.chatSession.addMessage(new AIMessage(aiMessageChunk));
          if (aiMessageChunk.tool_call_chunks && aiMessageChunk.tool_call_chunks.length > 0) {
            done = false;
          }
        }
      }

      this.pannel.webview.postMessage({
        type: "complete-ai-message",
      });
      console.log("Done processing");
    } catch (err: any) {
      this.handleError(err);
    }
  }

  private async handleSetModel(modelName: string) {
    const configuration = vscode.workspace.getConfiguration("brainReducer");
    configuration.update("model", modelName, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`AI model set to ${modelName}. Please change the API key if necessary.`);
  }

  private handleError(err: any) {
    console.error(err);
    if (err.message && err.message.includes("Please set an API key")) {
      this.pannel.webview.postMessage({
        type: "ai-message-error",
        data: "Please set an API key for the selected model.",
      });
      vscode.window.showErrorMessage(
        "Please set an API key for the selected model."
      );
      const setApiKeyCommand = SetApiKeyCommand.getInstance();
      vscode.commands.executeCommand(setApiKeyCommand.Name);
    } else {
      this.pannel.webview.postMessage({
        type: "ai-message-error",
        data: err.message || "Unknown error",
      });
      vscode.window.showErrorMessage(
        `An error occur: ${err.message || "Unknown error"}`
      );
    }
  }
}
