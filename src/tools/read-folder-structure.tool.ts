import { BaseTool } from "./base-tool";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import ignore from "ignore";

export class ReadWorkspaceFolderStructureTool extends BaseTool {
    private static instance: ReadWorkspaceFolderStructureTool;
    static getInstance() {
        if (!this.instance) {
            this.instance = new ReadWorkspaceFolderStructureTool();
        }
        return this.instance;
    }

    private constructor() {
        super({
            toolName: "readWorkspaceFolderStructure",
            toolDescription: "Read the workspace folder structure",
        })
    }

    async handle() {
        let structure: Record<string, any> = {};
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                structure[folder.name] = this.readFolderStructure(folder.uri.fsPath);
            }
        }
        return structure;
    }


    private readFolderStructure(folderPath: string) {
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

    getMessage(input: any): string {
        return `Reading the folder structure of the workspace...`;
    }
}