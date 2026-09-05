import { chunkFiles } from "../../services/chunker.js";
import { fetchRepoFiles } from "../../services/github.js";
import { inngest } from "../index.js"


export const indexRepo = inngest.createFunction(
    { id: "index-repo", triggers: [{ event: "repo/index.requested" }] },
    async ({ event, step }) => {
        const { githubToken, owner, repo } = event.data;

        const repoName = repo.replace(/\.git$/, "");
        const repoKey = `${owner}/${repoName}`;

        const files = await step.run("fetch-files", async()=>{
            return fetchRepoFiles(githubToken, owner, repoName)
        })
        const documents = await step.run("chunk-files", async()=>{
            return chunkFiles(files, repoKey)
        })
        

        return {
            repo:repoKey,
            fileCount: files.length,
            chunkCount: documents.length
        }
    }
)