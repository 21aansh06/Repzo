import { askQuestion } from "../../services/rag.js";
import { inngest } from "../index.js"

export const askQuestions = inngest.createFunction(
    { id: "ask-question", triggers: [{ event: "chat/question.requested" }] },
    async ({ event, step }) => {
        const { repo, question } = event.data;

        try {
            const result = await step.run("retrieve-and-answer", async () => {
                return askQuestion(repo, question)
            })
            return {
                repo,
                question,
                status: "completed",
                answer: result.answer,
                sources: result.sources,
            };
        } catch (error) {
            throw error;
        }
    }
)