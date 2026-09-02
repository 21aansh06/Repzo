import express from "express";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";

const app = express()

app.use(express.json());
app.use(express.json());
app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (req,res)=>{
    res.send("hello!")
})

export default app; 
