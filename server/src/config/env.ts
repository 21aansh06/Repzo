import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),

    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),

    PINECONE_API_KEY: z.string().min(1, "PINECONE_API_KEY is required"),

    PINECONE_INDEX: z.string().min(1)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(
        "❌ Invalid environment variables:",
        z.prettifyError(parsedEnv.error),
    );

    process.exit(1);
}

export const env = parsedEnv.data;