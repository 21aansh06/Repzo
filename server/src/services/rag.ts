import { ChatOpenAI } from "@langchain/openai";
import { search, type SearchDocument, } from "./vectorStore.js";

const DEFAULT_TOP_K = 5;
const MAX_CONTEXT_CHARS = 50_000;

const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
});

export interface AskQuestionResult {
    answer: string;
    sources: string[];
}

function toText(content: unknown): string {
    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === "string") {
                    return part;
                }

                if (
                    typeof part === "object" &&
                    part !== null &&
                    "text" in part &&
                    typeof part.text === "string"
                ) {
                    return part.text;
                }

                return "";
            })
            .join("");
    }

    return String(content ?? "");
}

function buildContext(
    docs: readonly SearchDocument[],
): string {
    let context = "";

    for (const doc of docs) {
        const path = doc.metadata.path ?? "Unknown file";

        const chunk = `File: ${path}\n${doc.pageContent}`;

        if (
            context.length > 0 &&
            context.length + chunk.length + 2 > MAX_CONTEXT_CHARS
        ) {
            break;
        }

        context += context.length > 0
            ? `\n\n${chunk}`
            : chunk;
    }

    return context;
}

function extractSources(
    docs: readonly SearchDocument[],
): string[] {
    return [
        ...new Set(
            docs
                .map((doc) => doc.metadata.path)
                .filter(
                    (path): path is string =>
                        typeof path === "string" &&
                        path.length > 0,
                ),
        ),
    ];
}

export async function askQuestion(
    repo: string,
    question: string,
    topK: number = DEFAULT_TOP_K,
): Promise<AskQuestionResult> {
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
        throw new Error("Question is required");
    }

    if (topK <= 0) {
        throw new Error("topK must be greater than 0");
    }

    const docs = await search(
        repo,
        normalizedQuestion,
        topK,
    );

    if (docs.length === 0) {
        return {
            answer:
                "No indexed content was found for this repo. Index it first, then try again.",
            sources: [],
        };
    }

    const context = buildContext(docs);

    const response = await llm.invoke(
        `Answer the question using only the provided repository context.

Rules:
- Use only the repository context.
- Do not use outside knowledge.
- Do not invent files, code, functions, or behavior.
- If the answer cannot be determined from the context, say so.
- When relevant, mention the file path that supports the answer.

Repository context:

${context}

Question:
${normalizedQuestion}`,
    );

    return {
        answer: toText(response.content).trim(),
        sources: extractSources(docs),
    };
}