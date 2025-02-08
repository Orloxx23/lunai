import { z } from "zod";

export const questionSchema = z.object({
  questions: z.array(
    z.object({
      title: z.string().describe("question"),
      options: z
        .array(
          z
            .object({
              title: z.string().describe("option"),
              isCorrect: z.boolean().describe("isCorrect"),
            })
            .describe(
              "options, if multiple question, if open question, empty array"
            )
        )
        .optional(),
      type: z.enum(["multiple", "open"]).describe("question type (multiple or open)"),
      correctAnswer: z
        .string()
        .optional()
        .describe("correct answer or idea, if open question"),
    })
  ),
});
