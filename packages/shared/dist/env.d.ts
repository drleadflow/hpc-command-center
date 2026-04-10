import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    ANTHROPIC_API_KEY: z.ZodOptional<z.ZodString>;
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    OPENROUTER_API_KEY: z.ZodOptional<z.ZodString>;
    EXA_API_KEY: z.ZodOptional<z.ZodString>;
    SERPAPI_API_KEY: z.ZodOptional<z.ZodString>;
    TAVILY_API_KEY: z.ZodOptional<z.ZodString>;
    GITHUB_TOKEN: z.ZodOptional<z.ZodString>;
    PORT: z.ZodDefault<z.ZodNumber>;
    AUTH_SECRET: z.ZodOptional<z.ZodString>;
    DATABASE_URL: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
}, "strip", z.ZodTypeAny, {
    PORT: number;
    DATABASE_URL: string;
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    ANTHROPIC_API_KEY?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    OPENROUTER_API_KEY?: string | undefined;
    EXA_API_KEY?: string | undefined;
    SERPAPI_API_KEY?: string | undefined;
    TAVILY_API_KEY?: string | undefined;
    GITHUB_TOKEN?: string | undefined;
    AUTH_SECRET?: string | undefined;
}, {
    ANTHROPIC_API_KEY?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    OPENROUTER_API_KEY?: string | undefined;
    EXA_API_KEY?: string | undefined;
    SERPAPI_API_KEY?: string | undefined;
    TAVILY_API_KEY?: string | undefined;
    GITHUB_TOKEN?: string | undefined;
    PORT?: number | undefined;
    AUTH_SECRET?: string | undefined;
    DATABASE_URL?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    LOG_LEVEL?: "debug" | "info" | "warn" | "error" | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare const env: {
    PORT: number;
    DATABASE_URL: string;
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    ANTHROPIC_API_KEY?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    OPENROUTER_API_KEY?: string | undefined;
    EXA_API_KEY?: string | undefined;
    SERPAPI_API_KEY?: string | undefined;
    TAVILY_API_KEY?: string | undefined;
    GITHUB_TOKEN?: string | undefined;
    AUTH_SECRET?: string | undefined;
};
export {};
//# sourceMappingURL=env.d.ts.map