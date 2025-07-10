import z from "zod";
import { BaseTool } from "./base-tool";
import * as vscode from "vscode";
import puppeteer from "puppeteer-core";
import { BrowserSession } from "../sessions";

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
        const browser = await BrowserSession.getBrowser();

        const page = await browser.newPage();
        await page.goto(input.url, { waitUntil: "networkidle0" });
        const content = await page.$eval("body", (body) => body.innerText);

        return content;
    }

}