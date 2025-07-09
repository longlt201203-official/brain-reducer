import * as vscode from 'vscode';
import { BaseCommand } from './base-command';

export class SetChromeLocationCommand extends BaseCommand {
    private static instance: SetChromeLocationCommand;

    static initialize(context: vscode.ExtensionContext) {
        this.instance = new SetChromeLocationCommand(context);
        return this.instance;
    }

    static getInstance() {
        return this.instance;
    }

    private constructor(
        context: vscode.ExtensionContext
    ) {
        super(context, "brainReducer.setChromeLocation");
    }

    async handle() {
        const configuration = vscode.workspace.getConfiguration('brainReducer');
        const currentChromeLocation = configuration.get<string>('chromeLocation', '');

        const chromeLocation = await vscode.window.showInputBox({
            prompt: "Enter the path to the Chrome executable",
            placeHolder: "e.g., C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            value: currentChromeLocation,
        });

        if (chromeLocation) {
            await configuration.update('chromeLocation', chromeLocation, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Chrome location set to: ${chromeLocation}`);
        }
    }
}