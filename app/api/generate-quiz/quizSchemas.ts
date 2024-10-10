import { z } from "zod";

export const questionSchema = z.object({
  questions: z.array(
    z.object({
      title: z.string().describe("question"),
      options: z.array(
        z.object({
          title: z.string().describe("option"),
          isCorrect: z.boolean().describe("isCorrect"),
        })
      ),
    })
  ),
});
