import * as vscode from "vscode"

export abstract class BasePannel {
    protected readonly pannel: vscode.WebviewPanel;
    constructor(
        protected readonly context: vscode.ExtensionContext,
        protected readonly viewType: string,
        protected readonly title: string,
        protected readonly viewColumn: vscode.ViewColumn,
        protected readonly options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
    ) {
        this.pannel = vscode.window.createWebviewPanel(viewType, title, viewColumn, options);
        this.pannel.webview.html = this.getHtmlForWebview(this.pannel.webview);
        this.pannel.webview.onDidReceiveMessage(this.messageHandler.bind(this), undefined, context.subscriptions);
        this.pannel.onDidChangeViewState(this.handleChangeViewState.bind(this), undefined, context.subscriptions);
        this.pannel.onDidDispose(this.handleDidDispose.bind(this), undefined, context.subscriptions);
    }

    abstract getHtmlForWebview(webview: vscode.Webview): string;
    abstract handleChangeViewState(e: vscode.WebviewPanelOnDidChangeViewStateEvent): void;
    abstract handleDidDispose(): void;
    abstract messageHandler(message: any): any;
}