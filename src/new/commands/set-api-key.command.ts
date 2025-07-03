import * as vscode from "vscode";
import { BaseCommand } from "./base-command";

export class SetApiKeyCommand extends BaseCommand {
    private static instance: SetApiKeyCommand;

    static initialize(context: vscode.ExtensionContext) {
        this.instance = new SetApiKeyCommand(context);
        return this.instance;
    }

    static getInstance() {
        return this.instance;
    }

    constructor(context: vscode.ExtensionContext) {
        super(context, "brain-reducer.set-api-key");
    }

    async handle() {
        const apiKey = this.context.globalState.get("brain-reducer.api-key", "");
        const input = await vscode.window.showInputBox({
            password: true,
            title: "Set API Key",
            prompt: "Enter your API Key",
            value: apiKey
        });
        await this.context.globalState.update("brain-reducer.api-key", input || "");
        vscode.window.showInformationMessage("Set API Key successfully!")
    }
}