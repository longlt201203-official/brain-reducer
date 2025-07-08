import * as vscode from "vscode";
import { ReadFileContentTool } from "./read-file-content.tool";
import { ReadWorkspaceFolderStructureTool } from "./read-folder-structure.tool";
import { BaseTool } from "./base-tool";

export class ToolsManager {
    private static instance: ToolsManager;
    static initialize(context: vscode.ExtensionContext) {
        this.instance = new ToolsManager(context);
    }

    static getInstance() {
        return this.instance;
    }

    private readonly toolsMap: Record<string, BaseTool> = {};
    private constructor(
        private readonly context: vscode.ExtensionContext
    ) {
        const readFileContentTool = ReadFileContentTool.getInstance();
        const readWorkspaceFolderStructureTool = ReadWorkspaceFolderStructureTool.getInstance();

        this.toolsMap[readFileContentTool.Tool.name] = readFileContentTool;
        this.toolsMap[readWorkspaceFolderStructureTool.Tool.name] = readWorkspaceFolderStructureTool;
    }

    get ToolsMap() {
        return this.toolsMap;
    }
}