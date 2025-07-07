import * as vscode from "vscode";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatSession } from "../sessions";
import { AIToolsManager } from "./tools";
import { ChatAnthropic } from "@langchain/anthropic";

const AI_PROMPT = `
You are an AI coding assistant with access to a file-reading tool. Follow this step-by-step approach for every user question:

**Step 1:** Before answering, assess whether reading any files is necessary to provide an accurate and context-aware response. Consider whether the question involves:
- Existing code, components, or logic
- Bug reports or unexpected behavior
- Configuration or file-specific details

**Step 2:** If relevant files are needed, proactively choose and read the files yourself using the file-reading tool — even if the user hasn't explicitly named them.

**Step 3:** After reviewing the necessary files, construct your response based on the actual content. Do not guess when real file content is accessible.

**Formatting Rule:**  
When sharing code from a specific file, start the code block with a comment indicating the filename:
- JavaScript: // filename: example.js  
- Python: # filename: example.py

If the code is general and not tied to a specific file, no filename comment is needed.

Provide clear, concise explanations and practical, working code. Prioritize accuracy by grounding your answers in real project files when possible.

Workspace structure:
{workspaceStructure}
`;

export class AiService {
  private static instance: AiService;

  static initialize(context: vscode.ExtensionContext) {
    this.instance = new AiService(context);
  }

  static getInstance() {
    return this.instance;
  }

  private constructor(private readonly context: vscode.ExtensionContext) { }

  private createModel(modelName: string): BaseChatModel {
    const apiKey = vscode.workspace
      .getConfiguration("brainReducer")
      .get<string>("apiKey", "");
    switch (modelName) {
      case "claude-sonnet-4-20250514":
        return new ChatAnthropic({
          model: modelName,
          apiKey: apiKey,
        });
      case "gemini-2.0-flash":
        return new ChatGoogleGenerativeAI({
          model: modelName,
          apiKey: apiKey,
        });
      default:
        throw new Error("Model not found!");
    }
  }

  async promptForAnswer(modelName: string, chatSession: ChatSession) {
    const messageList = chatSession.getMessageList();
    const model = this.createModel(modelName);
    const toolsMap = AIToolsManager.getInstance().getToolsMap();
    const structure =
      AIToolsManager.getInstance().readWorkspaceFolderStructure();
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", AI_PROMPT],
      new MessagesPlaceholder("msgs"),
    ]);

    const promptValue = await promptTemplate.invoke({
      workspaceStructure: JSON.stringify(structure),
      msgs: messageList,
    });

    return await model.bindTools!(Object.values(toolsMap)).stream(promptValue);
  }
}
