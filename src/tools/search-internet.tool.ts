import z from "zod";
import { BaseTool } from "./base-tool";
import puppeteer from "puppeteer-core";
import * as vscode from "vscode";

export class SearchInternetTool extends BaseTool {
    private static instance: SearchInternetTool;
    static getInstance() {
        if (!this.instance) {
            this.instance = new SearchInternetTool();
        }
        return this.instance;
    }

    private constructor() {
        super({
            toolName: "searchInternet",
            toolDescription: "Search the internet for information",
            inputSchema: z.string().describe("The query to search on the internet")
        });
    }

    getMessage(input: string) {
        return `Searching the internet for: ${input}...`;
    }

    async handle(input: string) {
        let data: {
            title: string;
            href: string | null;
        }[] = [];
        const chromeLocation = vscode.workspace.getConfiguration('brainReducer').get<string>('chromeLocation');
        if (!chromeLocation) {
            throw new Error("Chrome location is not set. Please set it with \"Brain Reducer: Set Chrome Location\" command.");
        }
        const browser = await puppeteer.launch({
            executablePath: chromeLocation,
            headless: false,
            defaultViewport: null
        });

        const page = await browser.newPage();
        await page.goto('https://privacia.org/search?q=' + encodeURIComponent(input));

        const resultsSelector = '.gsc-webResult.gsc-result'
        const webResultTitleSelector = '.web-result-title';
        const resultsHandle = await page.waitForSelector(resultsSelector, { timeout: 10000 });

        if (resultsHandle) {
            const webResultHandles = await resultsHandle.$$(webResultTitleSelector);
            data = await Promise.all(webResultHandles.map((h) => h.evaluate(node => ({
                title: node.textContent.trim(),
                href: node.getAttribute("href")
            }))));
        }

        await browser.close();

        return data;
    }
}