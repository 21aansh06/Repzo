import express from "express";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import indexRoutes from "./routes/indexRoutes.js";

const app = express()

app.use(express.json());
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/index", indexRoutes)

app.get("/", (req,res)=>{
    res.send("hello!")
})

export default app; 
