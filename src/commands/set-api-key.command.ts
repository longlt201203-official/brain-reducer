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
    super(context, "brainReducer.setApiKey");
  }

  async handle() {
    const configuration = vscode.workspace.getConfiguration("brainReducer");
    const apiKey = configuration.get<string>("apiKey", "");
    const input = await vscode.window.showInputBox({
      password: true,
      title: "Set API Key",
      prompt: "Enter your API Key",
      value: apiKey,
    });
    if (input != undefined && input.trim() != "") {
      await configuration.update(
        "apiKey",
        input,
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage("Set API Key successfully!");
    }
  }
}
