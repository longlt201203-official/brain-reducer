import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DynamicStructuredTool, DynamicTool, tool } from "@langchain/core/tools";
import ignore from "ignore";
import z from "zod";

const ReadFileContentInputSchema = z.object({
    filepath: z.string().describe("The path of the file to read"),
    workspace: z.string().describe("Workspace name")
})

export class AIToolsManager {
    private static instance: AIToolsManager;

    static initialize(context: vscode.ExtensionContext) {
        this.instance = new AIToolsManager(context);
    }

    static getInstance() {
        return this.instance;
    }

    private readonly toolsMap: Record<string, DynamicTool | DynamicStructuredTool> = {};
    private constructor(
        private readonly context: vscode.ExtensionContext
    ) {
        // this.toolsMap.readWorkspaceFolderStructure = tool(
        //     async () => {
        //         return this.readWorkspaceFolderStructure()
        //     },
        //     {
        //         name: 'readWorkspaceFolderStructure',
        //         description: 'Read the workspace folder structure',
        //     }
        // )
        this.toolsMap.readFileContent = tool(
            async (input: z.infer<typeof ReadFileContentInputSchema>) => {
                return this.readFileContent(input)
            },
            {
                name: 'readFileContent',
                description: 'Read the file content',
                schema: ReadFileContentInputSchema
            }
        )
    }

    getToolsMap() {
        return this.toolsMap;
    }

    readWorkspaceFolderStructure() {
        let structure: Record<string, any> = {};
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                structure[folder.name] = this.readFolderStructure(folder.uri.fsPath);
            }
        }
        return structure;
    }

    readFolderStructure(folderPath: string) {
        let structure: Record<string, any> = {};
        let ig = ignore();
        const gitignorePath = path.join(folderPath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ig.add(gitignoreContent.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#')));
        }
        const fileList = ig.filter(fs.readdirSync(folderPath));
        for (const filename of fileList) {
            const filepath = path.join(folderPath, filename);
            const stat = fs.statSync(filepath);
            if (stat.isDirectory()) {
                structure[filename] = this.readFolderStructure(filepath);
            } else {
                structure[filename] = filename;
            }
        }
        return structure;
    }

    private readFileContent({ filepath, workspace }: z.infer<typeof ReadFileContentInputSchema>) {
        const workspacePath = vscode.workspace.workspaceFolders?.find(item => item.name == workspace)?.uri.fsPath;
        if (!workspacePath) return "";
        const relativePath = path.join(workspacePath, filepath);
        if (!fs.existsSync(relativePath)) return "";
        return fs.readFileSync(relativePath, 'utf-8');
    }
}