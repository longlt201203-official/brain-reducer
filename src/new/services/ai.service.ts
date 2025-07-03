import * as vscode from "vscode";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatSession } from "../sessions";
import { AIToolsManager } from "./tools";

const AI_PROMPT = `
You are an AI coding assistant with access to a file-reading tool. Whenever a user asks a question involving existing code, logic, bugs, or behavior:

- Use the file-reading tool freely and proactively.
- You are allowed to decide which files to read to fully understand the context, even if the user doesn't explicitly mention them.
- Prioritize reading relevant files before answering to ensure accurate and context-aware responses.

When sharing code from a specific file:
- Start the code block with a comment indicating the filename, like:
// filename: example.js
# filename: example.py

If the code is general and not tied to a specific file, no filename comment is needed.

Give clear, concise explanations and practical, working code. Always use available file content to improve accuracy, and don’t rely on assumptions when file data is accessible.

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

    private constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    private createModel(modelName: string): BaseChatModel {
        switch (modelName) {
            case "gemini-2.0-flash":
                return new ChatGoogleGenerativeAI({
                    model: modelName,
                    apiKey: this.context.globalState.get("brain-reducer.api-key")
                })
            default:
                throw new Error("Model not found!")
        }
    }

    async promptForAnswer(modelName: string, chatSession: ChatSession) {
        const messageList = chatSession.getMessageList();
        const model = this.createModel(modelName);
        const toolsMap = AIToolsManager.getInstance().getToolsMap();
        const structure = AIToolsManager.getInstance().readWorkspaceFolderStructure();
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", AI_PROMPT],
            new MessagesPlaceholder("msgs")
        ]);

        const promptValue = await promptTemplate.invoke({
            workspaceStructure: JSON.stringify(structure),
            msgs: messageList
        });

        return await model.bindTools!(Object.values(toolsMap)).stream(promptValue);
    }
}