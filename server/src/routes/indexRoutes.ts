import { Router } from "express";
import { inngest } from "../inngest/index.js";
import { parseRepo } from "../services/github.js";
import { env } from "../config/env.js";


const indexRoutes = Router();

indexRoutes.post("/", async (req, res) => {
  const githubToken = env.GITHUB_TOKEN;
  const { owner, repo, repoKey } = parseRepo(req.body.repo);


  await inngest.send({
    name: "repo/index.requested",
    data: {githubToken, owner, repo, repoKey },
  });

  res.json("Repo Indexing");
});

export default indexRoutes;