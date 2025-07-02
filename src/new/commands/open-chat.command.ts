import * as vscode from "vscode";
import { BaseCommand } from "./base-command";
import * as path from "path";
import * as fs from "fs";

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
        super(context, "brain-reducer.open-chat");
    }

    handle(): void | Promise<void> {
        const chatViewPannel = vscode.window.createWebviewPanel('chat-view', 'AI Chat', vscode.ViewColumn.Two, {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        });

        chatViewPannel.webview.html = this.getHtmlForWebview(chatViewPannel.webview);
        this.test();
    }

    private test() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                // const fileList = fs.readdirSync(folder.uri.fsPath);
                // console.log(fileList);
                console.log("Reading folder", folder.name);
            }
        }
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        const extensionUri = this.context.extensionUri;
        const htmlPath = path.join(extensionUri.fsPath, "views", 'chat-view', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        const bootstrapCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'bootstrap', 'css', 'bootstrap.min.css'));
        const bootstrapJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'bootstrap', 'js', 'bootstrap.bundle.min.js'));
        const markedJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'marked.js'))
        const markedHighlightJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'marked-highlight.js'))
        const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'views', 'chat-view', 'index.js'));
        htmlContent = htmlContent.replace('{{bootstrapCssUri}}', bootstrapCssUri.toString());
        htmlContent = htmlContent.replace('{{bootstrapJsUri}}', bootstrapJsUri.toString());
        htmlContent = htmlContent.replace('{{markedJsUri}}', markedJsUri.toString());
        htmlContent = htmlContent.replace('{{markedHighlightJsUri}}', markedHighlightJsUri.toString());
        htmlContent = htmlContent.replace('{{jsUri}}', jsUri.toString());
        return htmlContent;
    }
}