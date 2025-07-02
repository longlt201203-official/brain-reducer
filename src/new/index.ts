import * as vscode from "vscode";

const outputChannel = vscode.window.createOutputChannel('Brain Reducer');

export function activate(context: vscode.ExtensionContext) {
    outputChannel.appendLine('Brain Reducer extension is now activating...');

    context.subscriptions.push(
        vscode.commands.registerCommand('brain-reducer.openChat', () => {
            vscode.window.showInformationMessage("Chat Opened!");
        })
    )
}

export function deactivate() {
    outputChannel.appendLine('Brain Reducer extension is being deactivated...');
}
