import {inngest} from "./client.js"
import { indexRepo } from "./functions/indexRepo.js"

export {inngest}

export const functions = [indexRepo]