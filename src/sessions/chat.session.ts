import * as vscode from "vscode";
import { AIMessage, BaseMessage, DataContentBlock, HumanMessage, PlainTextContentBlock } from "@langchain/core/messages";
import { ToolsManager } from "../tools";

export class ChatSession {
    private messageList: BaseMessage[] = [];
    constructor(private readonly context: vscode.ExtensionContext) { }

    getMessageList() {
        return this.messageList;
    }

    addMessage(message: BaseMessage) {
        this.messageList.push(message);
    }

    clearMessageList() {
        this.messageList = [];
    }

    getJSONMessageList() {
        const sessionData: any[] = [];
        let aiMessageContinue = false;
        let aiMessageContentText = "";
        for (const msg of this.messageList) {
            if (msg instanceof HumanMessage) {
                const humanMessageContent = msg.content as DataContentBlock[];
                sessionData.push({
                    role: "user",
                    content: (humanMessageContent[0] as PlainTextContentBlock).text,
                    images: (humanMessageContent.slice(1) as any[]).map((item) => item.image_url.url)
                });
            } else if (msg instanceof AIMessage) {
                aiMessageContinue = false;
                if (typeof msg.content == "string") {
                    aiMessageContentText += `\n\n${msg.content}\n\n`;
                } else {
                    const aiMessageContent = msg.content as DataContentBlock[];
                    for (const item of aiMessageContent) {
                        if (item.type == "text") {
                            aiMessageContentText += `\n\n${item.text}\n\n`
                        }
                    }
                }

                if (msg.tool_calls && msg.tool_calls.length > 0) {
                    aiMessageContinue = true;
                    const toolsMap = ToolsManager.getInstance().ToolsMap;
                    for (const toolCall of msg.tool_calls) {
                        const selectedTool = toolsMap[toolCall.name];
                        aiMessageContentText += `\n\n${selectedTool.getMessage(toolCall.args)}\n\n`;
                    }
                }

                if (!aiMessageContinue) {
                    sessionData.push({
                        role: "assistant",
                        content: aiMessageContentText.trim(),
                    })
                    aiMessageContentText = "";
                }
            }
        }
        return sessionData;
    }
}