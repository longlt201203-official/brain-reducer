import * as vscode from "vscode";
import { ReadFileContentTool } from "./read-file-content.tool";
import { ReadWorkspaceFolderStructureTool } from "./read-folder-structure.tool";
import { BaseTool } from "./base-tool";
import { SearchInternetTool } from "./search-internet.tool";
import { VisitUrlTool } from "./visit-url.tool";
import { DynamicStructuredTool, DynamicTool } from "langchain/tools";

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
        const searchInternetTool = SearchInternetTool.getInstance();
        const visitUrlTool = VisitUrlTool.getInstance();

        this.toolsMap[readFileContentTool.Tool.name] = readFileContentTool;
        this.toolsMap[readWorkspaceFolderStructureTool.Tool.name] = readWorkspaceFolderStructureTool;
        this.toolsMap[searchInternetTool.Tool.name] = searchInternetTool;
        this.toolsMap[visitUrlTool.Tool.name] = visitUrlTool;
    }

    get ToolsMap() {
        return this.toolsMap;
    }

    getToolsList(internetSearch: boolean = false) {
        const toolsList: (DynamicTool | DynamicStructuredTool)[] = [];
        for (const toolName in this.toolsMap) {
            const tool = this.toolsMap[toolName];
            if (!internetSearch && (
                tool instanceof SearchInternetTool ||
                tool instanceof VisitUrlTool
            )) {
                console.log(`Skipping tool: ${toolName} because internet search is disabled.`);
                continue;
            }

            toolsList.push(tool.Tool);
        }
        return toolsList;
    }
}