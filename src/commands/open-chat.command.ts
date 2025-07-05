import * as vscode from "vscode";
import { BaseCommand } from "./base-command";
import { ChatViewPannel } from "../pannels";
import { SetApiKeyCommand } from "./set-api-key.command";

export class OpenChatCommand extends BaseCommand {
  private static instance: OpenChatCommand;

  static initialize(context: vscode.ExtensionContext) {
    this.instance = new OpenChatCommand(context);
    return this.instance;
  }

  static getInstance() {
    return this.instance;
  }

  private constructor(context: vscode.ExtensionContext) {
    super(context, "brainReducer.openChat");
  }

  async handle() {
    const apiKey = vscode.workspace
      .getConfiguration("brainReducer")
      .get<string>("apiKey", "");
    if (!apiKey) {
      const setApiKeyCommand = SetApiKeyCommand.getInstance();
      await vscode.commands.executeCommand(setApiKeyCommand.Name);
    }
    new ChatViewPannel(this.context);
  }
}
