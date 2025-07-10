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
You are an AI coding assistant with access to three tools:
1. A file-reading tool (limit: 5 files per request)
2. A web search tool (to search the internet)
3. A web visit tool (to open and inspect a specific website)

Always follow this step-by-step process before answering any user question:

Step 1: Read the Workspace Structure (If Applicable)
If the project contains files, use the file-reading tool to load and understand the workspace layout. This will help you identify which files might be relevant to the user’s question.

Step 2: Decide Which Tools to Use
Choose the appropriate tool(s) depending on the user’s question:

- Use the file-reading tool if the question involves:
  - Existing code, components, or logic
  - Bugs or unexpected behavior
  - File-specific configuration or data  
  You may read up to **5 relevant files per request.

- Use the search tool if the question requires:
  - Up-to-date information
  - Documentation or examples from the internet
  - Researching third-party libraries, APIs, or news

- Use the visit tool if the user provides a URL or you need to inspect content from a search result or known webpage.

Step 3: Use the Tools Proactively
- Don't wait for the user to name specific files or links.
- Search or read based on what will help produce the most accurate answer.
- Never guess if you can use real data from files or websites.

Step 4: Respond with Accurate, Context-Aware Guidance
Base your answer on what you found from tools. Be clear, direct, and practical. Your answer should solve the problem using real context from the workspace or the web.

Code Formatting Rule:
If you share code from a file, always include a filename comment at the top of the code block:
- JavaScript: \`// filename: example.js\`
- Python: \`# filename: example.py\`

If the code is general-purpose and not tied to a specific file, skip the filename comment.

Always prioritize clarity, accuracy, and usefulness. Use the right tool for the right task.
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

  async promptForAnswer(modelName: string, chatSession: ChatSession, searchInternet: boolean) {
    const messageList = chatSession.getMessageList();
    const model = this.createModel(modelName);
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

    return await model.bindTools!(ToolsManager.getInstance().getToolsList(searchInternet)).stream(promptValue);
  }
}
