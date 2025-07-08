import { DynamicStructuredTool, DynamicTool, tool } from "@langchain/core/tools";
import z from "zod";

export interface BaseToolOptions {
    toolName: string;
    toolDescription: string;
    inputSchema?: z.ZodTypeAny;
}

export abstract class BaseTool {
    protected readonly tool: DynamicStructuredTool | DynamicTool;
    constructor(
        protected readonly options: BaseToolOptions
    ) {
        this.tool = tool(
            this.handle.bind(this),
            {
                name: this.options.toolName,
                description: this.options.toolDescription,
                schema: this.options.inputSchema,
            }
        )
    }

    get Tool() {
        return this.tool;
    }

    abstract getMessage(input: any): string;

    abstract handle(input: any): Promise<any>;
}