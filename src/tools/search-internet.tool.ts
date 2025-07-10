import z from "zod";
import { BaseTool } from "./base-tool";
import { BrowserSession } from "../sessions";

const SearchInternetInputSchema = z.object({
    query: z.string().describe("The query to search on the internet")
})

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
            inputSchema: SearchInternetInputSchema
        });
    }

    getMessage(input: z.infer<typeof SearchInternetInputSchema>) {
        return `Searching the internet for: *${input.query}*...`;
    }

    async handle(input: z.infer<typeof SearchInternetInputSchema>) {
        let data: {
            title: string;
            href: string | null;
        }[] = [];
        const browser = await BrowserSession.getBrowser();

        const page = await browser.newPage();
        await page.goto('https://privacia.org/search?q=' + encodeURIComponent(input.query));

        const resultsSelector = '.gsc-webResult.gsc-result'
        const webResultTitleSelector = '.web-result-title';
        const resultsHandle = await page.waitForSelector(resultsSelector, { timeout: 10000 });

        if (resultsHandle) {
            const webResultHandles = await resultsHandle.$$(webResultTitleSelector);
            data = await Promise.all(webResultHandles.map((h) => h.evaluate(node => ({
                title: node.textContent ? node.textContent.trim() : "",
                href: node.getAttribute("href")
            }))));
        }

        return JSON.stringify(data);
    }
}