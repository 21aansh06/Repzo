import { Router } from "express";
import { inngest } from "../inngest/client.js";
import { parseRepo } from "../services/github.js";

const chatRoutes = Router();

chatRoutes.post("/", async (req, res) => {
    const { repo, question } = req.body ?? {};

    if (!repo || !question) {
        return res.status(400).json({ error: "repo and question are required" });
    }
    const { repoKey } = parseRepo(repo);

    await inngest.send({
        name: "chat/question.requested",
        data: { repo: repoKey, question },
    });

    res.status(200).json("success");
});



export default chatRoutes;