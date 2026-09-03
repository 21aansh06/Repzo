import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "./env.js";

export const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

export function getIndex(namespace: string) {
  return pinecone
    .index({
      name: env.PINECONE_INDEX,
    })
    .namespace(namespace);
}