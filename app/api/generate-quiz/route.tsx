import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { questionSchema } from "./quizSchemas";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { amount, context, difficulty } = await req.json();

  const result = await streamObject({
    model: openai("gpt-4o-mini"),
    schema: questionSchema,
    prompt: `in spanish, with a difficult ${difficulty}, generates ${amount} questions where each one must have 4 options where only one can be correct. that are based on the following context: ${context}`,
    temperature: 1,
});

  return result.toTextStreamResponse();
}
