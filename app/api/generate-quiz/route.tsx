import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { questionSchema } from "./quizSchemas";
import { createClient } from "@/utils/supabase/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = createClient();
  const auth = await supabase.auth.getUser();

  const user = auth.data.user;

  if (!user) {
    return Response.json(
      { error: "You must be logged in to submit a quiz" },
      { status: 401 }
    );
  }

  const { amount, context, difficulty } = await req.json();

  const result = await streamObject({
    model: openai("gpt-4o-mini"),
    schema: questionSchema,
    prompt: `in spanish, with a difficulty ${difficulty}, it generates ${amount} questions where each one must have 4 options where only one can be correct. it is based on the following context: ${context}. it can also generate true or false questions, in this case a maximum of 2 options are allowed. you can also generate open-ended questions.`,
    temperature: 1,
  });

  return result.toTextStreamResponse();
}
