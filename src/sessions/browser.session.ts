import * as vscode from 'vscode';
import puppeteer, { Browser } from "puppeteer-core";

export class BrowserSession {
    private static browser: Browser;

    static async getBrowser() {
        if (!this.browser) {
            const chromeLocation = vscode.workspace.getConfiguration('brainReducer').get<string>('chromeLocation');
            if (!chromeLocation) {
                throw new Error("Chrome location is not set. Please set it with \"Brain Reducer: Set Chrome Location\" command.");
            }

            this.browser = await puppeteer.launch({
                executablePath: chromeLocation,
                headless: false,
                defaultViewport: null
            });
        }

        return this.browser;
    }
}