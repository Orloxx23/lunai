import { createClient } from "@/utils/supabase/server";
import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";

type Answer = Record<string, string>;

type QuestionOption = {
  questionId: string;
  id: string;
  title: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  title: string;
  type: "multiple" | "open";
  correctAnswer?: string; // Agregamos el campo correctAnswer
  options?: QuestionOption[];
};

type ValidationResult = {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  feedback: string;
};

const feedbackSchema = z.object({
  generalFeedback: z.string(),
  questionFeedbacks: z.array(
    z.object({
      questionId: z.string(),
      userAnswer: z.string(),
      isCorrect: z.boolean(),
      feedback: z.string(),
    })
  ),
});

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const {
    email,
    quizId,
    answers,
  }: { email: string; quizId: string; answers: Answer } = await req.json();

  if (!email || !quizId || !answers) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const supabase = createClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch user data" }),
      { status: 500 }
    );
  }

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, title, type, correctAnswer")
    .eq("quizId", quizId);

  if (questionError || !questions || questions.length === 0) {
    return new Response(JSON.stringify({ error: "Error fetching questions" }), {
      status: 500,
    });
  }

  const questionIds = questions.map((q: any) => q.id);
  const { data: options, error: optionsError } = await supabase
    .from("options")
    .select("id, title, isCorrect, questionId")
    .in("questionId", questionIds);

  if (optionsError) {
    return new Response(JSON.stringify({ error: "Error fetching options" }), {
      status: 500,
    });
  }

  const formattedQuestions = questions.map((q) => ({
    id: q.id,
    title: q.title,
    type: q.type,
    correctAnswer: q.correctAnswer,
    options: options
      .filter((opt) => opt.questionId === q.id)
      .map((opt) => ({
        id: opt.id,
        title: opt.title,
        isCorrect: opt.isCorrect,
      })),
  }));

  const { object } = await generateObject({
    model: "gpt-4o-mini",
    schema: feedbackSchema,
    prompt: `
      Las siguientes son ${formattedQuestions.length} preguntas y respuestas del usuario.
      Genera un feedback general sobre el rendimiento del usuario, junto con feedback para cada pregunta.

      Preguntas y respuestas:
      ${formattedQuestions
        .map((q) => {
          const userAnswer = answers[q.id] || "Sin respuesta";
          const isCorrect =
            q.type === "multiple"
              ? q.options.find((opt) => opt.id === userAnswer)?.isCorrect ||
                false
              : userAnswer.trim().toLowerCase() ===
                (q.correctAnswer || "").trim().toLowerCase();
          return `
            - Pregunta: ${q.title}
            - Respuesta del usuario: ${userAnswer}
            - ¿Es correcta?: ${isCorrect ? "Sí" : "No"}
          `;
        })
        .join("\n")}
      Devuelve el feedback en el siguiente formato:
      {
        generalFeedback: string,
        questionFeedbacks: [
          {
            questionId: string,
            userAnswer: string,
            isCorrect: boolean,
            feedback: string
          }
        ]
      }.
    `,
  });

  const { generalFeedback, questionFeedbacks } = object;

  // Guardar las respuestas y el feedback
  const { error: quizResponseError, data: quizResponse } = await supabase
    .from("quiz_responses")
    .insert({
      userId: user.id,
      quizId: quizId,
      score: questionFeedbacks.filter((q) => q.isCorrect).length,
      feedback: generalFeedback,
    })
    .select("id")
    .single();

  if (quizResponseError || !quizResponse) {
    return new Response(
      JSON.stringify({ error: "Failed to save quiz response" }),
      { status: 500 }
    );
  }

  for (const feedback of questionFeedbacks) {
    const { error: questionResponseError } = await supabase
      .from("question_responses")
      .insert({
        quizResponseId: quizResponse.id,
        questionId: feedback.questionId,
        answer: feedback.userAnswer,
        isCorrect: feedback.isCorrect,
        feedback: feedback.feedback,
      });

    if (questionResponseError) {
      console.error(
        `Error saving response for question ${feedback.questionId}:`,
        questionResponseError
      );
      return new Response(
        JSON.stringify({ error: "Failed to save question responses" }),
        { status: 500 }
      );
    }
  }

  return new Response(
    JSON.stringify({
      email,
      score: questionFeedbacks.filter((q) => q.isCorrect).length,
      generalFeedback,
      questionFeedbacks,
    })
  );
}
