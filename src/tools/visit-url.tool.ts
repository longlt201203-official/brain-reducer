import z from "zod";
import { BaseTool } from "./base-tool";
import * as vscode from "vscode";
import puppeteer from "puppeteer-core";

const VisitUrlInputSchema = z.object({
    url: z.string().describe("The URL to visit")
});

export class VisitUrlTool extends BaseTool {
    private static instance: VisitUrlTool;
    static getInstance() {
        if (!this.instance) {
            this.instance = new VisitUrlTool();
        }
        return this.instance;
    }

    private constructor() {
        super({
            toolName: "visitUrl",
            toolDescription: "Visit a URL and return the page content",
            inputSchema: VisitUrlInputSchema
        })
    }

    getMessage(input: z.infer<typeof VisitUrlInputSchema>): string {
        return `Visiting the URL: *${input.url}*...`;
    }

    async handle(input: z.infer<typeof VisitUrlInputSchema>) {
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
        await page.goto(input.url, { waitUntil: "networkidle0" });
        const content = await page.$eval("body", (body) => body.innerText)
        await browser.close();

        return content;
    }

}