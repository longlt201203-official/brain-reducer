import * as vscode from "vscode";

export abstract class BaseCommand {
    constructor(
        protected readonly context: vscode.ExtensionContext,
        protected readonly name: string,
    ) {}

    get Name() {
        return this.name;
    }

    abstract handle(): void | Promise<void>;
}