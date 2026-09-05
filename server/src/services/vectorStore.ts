import { createHash } from "node:crypto";
import type { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getIndex } from "../config/pinecone.js";


const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});


const UPSERT_BATCH_SIZE = 100;
const DEFAULT_TOP_K = 5;

interface ChunkMetadata {
  path?: string;
  repo: string;
  text?: string;
}

export interface SearchDocument {
  pageContent: string;
  metadata: {
    path?: string;
    repo?: string;
  };
  score?: number;
}

export interface SaveChunksResult {
  saved: boolean;
  chunkCount: number;
}

function repoToNamespace(repo: string): string {
  return repo.replace("/", "-");
}


function normalizeDocuments(
  documents: readonly Document[],
): Document[] {
  return documents.filter(
    (document) =>
      typeof document.pageContent === "string" &&
      document.pageContent.trim().length > 0,
  );
}

function buildRecordId(
  repo: string,
  metadata: ChunkMetadata,
  content: string,
): string {
  return createHash("sha256")
    .update(`${repo}:${metadata.path ?? ""}:${content}`)
    .digest("hex");
}

// function toSearchDocument(
//   match: {
//     score?: number;
//     metadata?: Record<string, unknown>;
//   },
// ): SearchDocument {
//   const metadata = match.metadata ?? {};

//   const text =
//     typeof metadata.text === "string"
//       ? metadata.text
//       : "";

//   return {
//     pageContent: text,
//     metadata: {
//       path:
//         typeof metadata.path === "string"
//           ? metadata.path
//           : undefined,

//       repo:
//         typeof metadata.repo === "string"
//           ? metadata.repo
//           : undefined,
//     },
//     score: match.score,
//   };
// }

export async function saveChunks(
  repo: string,
  documents: readonly Document[],
): Promise<SaveChunksResult> {
  const chunks = normalizeDocuments(documents);

  if (chunks.length === 0) {
    return {
      saved: false,
      chunkCount: 0,
    };
  }

  const namespace = repoToNamespace(repo);
  const index = getIndex(namespace);

  const texts = chunks.map((document) => document.pageContent);

  const vectors = await embeddings.embedDocuments(texts);

 const records = chunks.map((document, index) => {
  const metadata: ChunkMetadata = {
    ...(typeof document.metadata.path === "string"
      ? { path: document.metadata.path }
      : {}),
    repo:
      typeof document.metadata.repo === "string"
        ? document.metadata.repo
        : repo,
  };

  return {
    id: buildRecordId(
      repo,
      metadata,
      document.pageContent,
    ),
    values: vectors[index]!,
    metadata: {
      text: document.pageContent,
      path: metadata.path ?? "",
      repo: metadata.repo,
    },
  };
});
  for (
    let start = 0;
    start < records.length;
    start += UPSERT_BATCH_SIZE
  ) {
    const batch = records.slice(
      start,
      start + UPSERT_BATCH_SIZE,
    );

    await index.upsert({
      records: batch,
    });
  }

  return {
    saved: true,
    chunkCount: chunks.length,
  };
}

// export async function search(
//   repo: string,
//   question: string,
//   topK: number = DEFAULT_TOP_K,
// ): Promise<SearchDocument[]> {
//   if (!question.trim()) {
//     return [];
//   }

//   if (topK <= 0) {
//     throw new Error("topK must be greater than 0");
//   }

//   const namespace = repoToNamespace(repo);
//   const index = getIndex(namespace);

//   const vector = await embeddings.embedQuery(question);

//   const response = await index.query({
//     vector,
//     topK,
//     includeMetadata: true,
//   });

//   return (response.matches ?? [])
//     .map(toSearchDocument)
//     .filter(
//       (document) =>
//         document.pageContent.trim().length > 0,
//     );
// }