import * as vscode from "vscode";
import { AIMessage, BaseMessage, DataContentBlock, HumanMessage, PlainTextContentBlock } from "@langchain/core/messages";

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
        for (const msg of this.messageList) {
            if (msg instanceof HumanMessage) {
                const humanMessageContent = msg.content as DataContentBlock[];
                sessionData.push({
                    role: "user",
                    content: (humanMessageContent[0] as PlainTextContentBlock).text,
                    images: (humanMessageContent.slice(1) as any[]).map((item) => item.image_url.url)
                });
            } else if (msg instanceof AIMessage) {
                sessionData.push({
                    role: "assistant",
                    content: msg.content,
                });
            }
        }
        return sessionData;
    }
}