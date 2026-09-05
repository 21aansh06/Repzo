import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { Document } from "@langchain/core/documents";

export interface RepoFile {
    path: string;
    content: string;
}

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
});

export async function chunkFiles(
    files: readonly RepoFile[],
    repo: string,
): Promise<Document[]> {
    const documents: Document[] = [];

    for (const file of files) {
        if (!file.content.trim()) {
            continue;
        }

        const chunks = await splitter.createDocuments(
            [file.content],
            [
                {
                    repo,
                    path: file.path,
                    source: `${repo}/${file.path}`,
                },
            ],
        );

        documents.push(...chunks);
    }

    return documents;
}