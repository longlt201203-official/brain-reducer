import * as vscode from "vscode";
import { BasePannel } from "./base-pannel";
import * as path from "path";
import * as fs from "fs";
import { ChatSession } from "../sessions";
import { AiService, AIToolsManager } from "../services";
import { concat } from "@langchain/core/utils/stream";
import { AIMessageChunk, HumanMessage, ToolMessage } from "@langchain/core/messages";

export class ChatViewPannel extends BasePannel {
    private readonly chatSession: ChatSession;
    private readonly aiService: AiService;
    constructor(context: vscode.ExtensionContext) {
        super(context, "chat-view", "AI Chat", vscode.ViewColumn.Two, {
            localResourceRoots: [context.extensionUri],
            enableScripts: true
        });

        this.chatSession = new ChatSession(context);
        this.aiService = AiService.getInstance();
    }

    getHtmlForWebview(webview: vscode.Webview): string {
        const extensionUri = this.context.extensionUri;
        const htmlPath = path.join(extensionUri.fsPath, "views", 'chat-view', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'index.css'));
        const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'index.js'));
        htmlContent = htmlContent.replace('{{cssUri}}', cssUri.toString());
        htmlContent = htmlContent.replace('{{jsUri}}', jsUri.toString());
        htmlContent = this.loadBootstrap(webview, htmlContent);
        htmlContent = this.loadHighlightJS(webview, htmlContent);
        htmlContent = this.loadMarkedJS(webview, htmlContent);
        return htmlContent;
    }

    private loadBootstrap(webview: vscode.Webview, htmlContent: string) {
        const extensionUri = this.context.extensionUri;
        const bootstrapCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'bootstrap', 'css', 'bootstrap.min.css'));
        const bootstrapJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'bootstrap', 'js', 'bootstrap.bundle.min.js'));
        htmlContent = htmlContent.replace('{{bootstrapCssUri}}', bootstrapCssUri.toString());
        htmlContent = htmlContent.replace('{{bootstrapJsUri}}', bootstrapJsUri.toString());
        return htmlContent;
    }

    private loadHighlightJS(webview: vscode.Webview, htmlContent: string) {
        const extensionUri = this.context.extensionUri;
        const hljsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'hljs', 'hljs.css'));
        const hljsJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'hljs', 'hljs.js'));
        htmlContent = htmlContent.replace('{{hljsCssUri}}', hljsCssUri.toString())
        htmlContent = htmlContent.replace('{{hljsJsUri}}', hljsJsUri.toString())
        return htmlContent;
    }

    private loadMarkedJS(webview: vscode.Webview, htmlContent: string) {
        const extensionUri = this.context.extensionUri;
        const markedJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'marked', 'marked.js'));
        const markedHighlightJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'marked', 'marked-highlight.js'));
        htmlContent = htmlContent.replace('{{markedJsUri}}', markedJsUri.toString());
        htmlContent = htmlContent.replace('{{markedHighlightJsUri}}', markedHighlightJsUri.toString());
        return htmlContent;
    }

    messageHandler(message: any) {
        switch (message.type) {
            case 'send-message':
                this.handleSendMessage(message.data);
                break;
        }
    }

    private async handleSendMessage(data: any) {
        try {
            this.chatSession.addMessage(new HumanMessage(data.content));
            const toolsMap = AIToolsManager.getInstance().getToolsMap();
            let aiMessage = '';
            let toolCallMessage: AIMessageChunk | undefined = undefined;
            let done = false;
            this.pannel.webview.postMessage({
                type: "init-ai-message",
            });

            console.log("Start processing")
            while (!done) {
                done = true;
                console.log("Iteration")
                if (toolCallMessage && toolCallMessage.tool_calls) {
                    this.chatSession.addMessage(toolCallMessage);
                    for (const toolCall of toolCallMessage.tool_calls) {
                        const selectedTool = toolsMap[toolCall.name];
                        if (selectedTool) {
                            const toolMessage: ToolMessage = await selectedTool.invoke(toolCall);
                            console.log(toolMessage)
                            this.chatSession.addMessage(toolMessage)
                        }
                    }
                    toolCallMessage = undefined;
                }
                let stream = await this.aiService.promptForAnswer(data.model, this.chatSession);
                for await (const chunk of stream) {
                    if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
                        toolCallMessage = toolCallMessage == undefined ? chunk : concat(toolCallMessage, chunk);
                        done = false;
                        continue;
                    }

                    if (chunk.content) {
                        aiMessage += chunk.content;
                        this.pannel.webview.postMessage({
                            type: "ai-message-chunk",
                            data: chunk.content
                        });
                        continue;
                    }
                }
            }

            this.pannel.webview.postMessage({
                type: "complete-ai-message"
            })
            console.log("Done processing")
        } catch (err: any) {
            console.error(err);
            vscode.window.showErrorMessage(`An error occur: ${err.message || "Unknown error"}`)
        }
    }
}