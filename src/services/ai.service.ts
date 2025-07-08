import * as vscode from "vscode";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatSession } from "../sessions";
import { ChatAnthropic } from "@langchain/anthropic";
import { ReadWorkspaceFolderStructureTool, ToolsManager } from "../tools";

const AI_PROMPT = `
You are an AI coding assistant with access to a file-reading tool. Follow the steps below for every user question:

**Step 1: Read the Workspace Structure**  
Use the file-reading tool to understand the overall workspace layout. This helps you identify which files may be relevant to the user’s question.

**Step 2: Identify Relevant Files (Max 5)**  
Based on the question and the workspace structure, determine whether any files need to be read. Prioritize relevance and **limit reads to 5 files per request**. Focus on:
- Existing code, logic, or components
- Reported bugs or unexpected behavior
- File-specific configuration or data

**Step 3: Read and Analyze the Files**  
Proactively read the selected files using the tool, even if the user didn’t name them. Do not guess when actual file content is accessible.

**Step 4: Respond with Context-Aware Guidance**  
Base your answer on the real content of the files. Ensure your explanation and code suggestions are accurate, grounded, and practical.

**Code Formatting Rule:**  
When sharing code from a specific file, always start with a filename comment:
- JavaScript: \`// filename: example.js\`  
- Python: \`# filename: example.py\`

General-purpose code not tied to a specific file does not need a filename comment.

Your responses must be clear, concise, and grounded in the real codebase. Use file-reading proactively—but never read more than 5 files per request.
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
      case "claude-3-5-sonnet-latest":
      case "claude-3-7-sonnet-latest":
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
    const toolsMap = ToolsManager.getInstance().ToolsMap;
    const structure =
      await ReadWorkspaceFolderStructureTool.getInstance().handle();
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", AI_PROMPT],
      new MessagesPlaceholder("msgs"),
    ]);

    const promptValue = await promptTemplate.invoke({
      workspaceStructure: JSON.stringify(structure),
      msgs: messageList,
    });

    return await model.bindTools!(Object.values(toolsMap).map(item => item.Tool)).stream(promptValue);
  }
}
