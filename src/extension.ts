import * as vscode from "vscode";
import { OpenChatCommand, SetApiKeyCommand } from "./commands";
import { AiService } from "./services";
import { ToolsManager } from "./tools";

const outputChannel = vscode.window.createOutputChannel("Brain Reducer");

export function activate(context: vscode.ExtensionContext) {
  outputChannel.appendLine("Brain Reducer extension is now activating...");

  const openChatCommand = OpenChatCommand.initialize(context);
  const setApiKeyCommand = SetApiKeyCommand.initialize(context);

  AiService.initialize(context);
  ToolsManager.initialize(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      openChatCommand.Name,
      openChatCommand.handle.bind(openChatCommand)
    ),
    vscode.commands.registerCommand(
      setApiKeyCommand.Name,
      setApiKeyCommand.handle.bind(setApiKeyCommand)
    )
  );
}

export function deactivate() {
  outputChannel.appendLine("Brain Reducer extension is being deactivated...");
}
