import z from "zod";
import { BaseTool } from "./base-tool";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const ReadFileContentInputSchema = z.object({
    filepath: z.string().describe("The path of the file to read"),
    workspace: z.string().describe("Workspace name")
})

export class ReadFileContentTool extends BaseTool {
    private static instance: ReadFileContentTool;
    static getInstance() {
        if (!this.instance) {
            this.instance = new ReadFileContentTool();
        }
        return this.instance;
    }

    private constructor() {
        super({
            toolName: "readFileContent",
            toolDescription: "Read the file content",
            inputSchema: ReadFileContentInputSchema
        });
    }

    async handle({ filepath, workspace }: z.infer<typeof ReadFileContentInputSchema>) {
        const workspacePath = vscode.workspace.workspaceFolders?.find(item => item.name == workspace)?.uri.fsPath;
        if (!workspacePath) return "";
        const relativePath = path.join(workspacePath, filepath);
        if (!fs.existsSync(relativePath)) return "";
        return fs.readFileSync(relativePath, 'utf-8');
    }

    getMessage(input: z.infer<typeof ReadFileContentInputSchema>): string {
        return `Reading the content of the file at path: ${input.filepath} in workspace: ${input.workspace}...`;
    }
}