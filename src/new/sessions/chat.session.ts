import * as vscode from "vscode";
import { BaseMessage } from "@langchain/core/messages";

export class ChatSession {
    private messageList: BaseMessage[] = [];
    constructor(private readonly context: vscode.ExtensionContext) {}

    getMessageList() {
        return this.messageList;
    }

    addMessage(message: BaseMessage) {
        this.messageList.push(message);
    }

    clearMessageList() {
        this.messageList = [];
    }
}