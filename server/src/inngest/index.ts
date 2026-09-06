import {inngest} from "./client.js"
import { askQuestions } from "./functions/askQuestions.js"
import { indexRepo } from "./functions/indexRepo.js"

export {inngest}

export const functions = [indexRepo, askQuestions]