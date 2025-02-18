import { createClient } from "@/utils/supabase/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
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

type FeedbackSchema = z.infer<typeof feedbackSchema>;
const feedbackSchema = z.object({
  generalFeedback: z.string(),
  questionFeedbacks: z.array(
    z.object({
      questionId: z.string(),
      feedback: z.string(),
      isCorrect: z.boolean(), // Agregamos isCorrect al feedback de cada pregunta
    })
  ),
});

export const maxDuration = 60;

async function getIsCorrectWithIA(
  question: string,
  userAnswer: string,
  correctAnswer: string
): Promise<boolean> {
  const { object: result } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      isCorrect: z.boolean(),
    }),
    prompt: `
      Esta es una pregunta de prueba:
      ${question}
      Respuesta del usuario: ${userAnswer}
      Idea general o respuestas esperada: ${correctAnswer}
      ¿La respuesta del usuario es correcta?
      Intenta ser un poco flexible en base a la respuesta esperada
      `,
  });

  return result.isCorrect;
}

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
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  const { data: quizResponse, error: quizResponseError } = await supabase
    .from("quiz_responses")
    .insert({ userId: user.id, quizId: quizId, score: 0, email: email })
    .select("id")
    .single();

  if (quizResponseError || !quizResponse) {
    return new Response(
      JSON.stringify({
        error: "Failed to create quiz response",
        quizResponseError,
      }),
      { status: 500 }
    );
  }

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, title, type, correctAnswer, weight")
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

  const results: ValidationResult[] = [];
  let correctAnswersCount = 0;

  // Preparar el payload para el feedback
  const feedbackPayloadPromises = questions.map(async (question: any) => {
    const userAnswer = answers[question.id];
    const questionOptions = options.filter(
      (opt: QuestionOption) => opt.questionId === question.id
    );
    const correctOption = questionOptions.find(
      (opt: QuestionOption) => opt.isCorrect
    );

    const isCorrect =
      question.type === "multiple"
        ? questionOptions.some(
            (opt: QuestionOption) => opt.id === userAnswer && opt.isCorrect
          )
        : await getIsCorrectWithIA(
            question.title,
            userAnswer,
            question.correctAnswer
          );

    return {
      questionId: question.id,
      question: question.title,
      userAnswer,
      correctAnswer: correctOption?.title || question.correctAnswer,
      type: question.type,
      isCorrect,
    };
  });

  try {
    const feedbackPayload = await Promise.all(feedbackPayloadPromises);
    const { object: feedbackResult } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: feedbackSchema,
      temperature: 1,
      prompt: `
        Eres un experto pedagogo.
        Estas son las respuestas proporcionadas por el usuario:\n\n${JSON.stringify(feedbackPayload)}\n\nPor favor, genera un feedback general dirigido al usuario, explicando con detalle en qué áreas tuvo un buen desempeño y en cuáles necesita mejorar.
        Asegúrate de ser claro y específico, proporcionando ejemplos concretos de lo que hizo bien y lo que podría hacer de manera diferente. Usa un tono positivo y constructivo.
        Además, ofrece una revisión individual de cada pregunta.
        
        En el feedback para cada pregunta, Debemos incluir lo siguiente:
        - Explicar por qué la respuesta es incorrecta: Mostrar una breve explicación de por qué la opción elegida es errónea.
        - Explicar por qué la respuesta correcta lo es: Dar una justificación clara de la respuesta correcta.
        - Incluir ejemplos específicos: Si aplica, comparar la respuesta equivocada con la correcta (ejemplo: fotosíntesis vs. respiración celular).
        
      `,
    });

    const { generalFeedback, questionFeedbacks } = feedbackResult;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const questionFeedback = questionFeedbacks.find(
        (fb: any) => fb.questionId === question.id
      );

      if (questionFeedback) {
        const isCorrect =
          question.type === "multiple"
            ? feedbackPayload.find((fb: any) => fb.questionId === question.id)
                ?.isCorrect || false
            : (questionFeedback.isCorrect ?? false);

        results.push({
          questionId: question.id,
          userAnswer,
          isCorrect,
          feedback: questionFeedback.feedback,
        });

        console.log("Question feedback:", question.weight, isCorrect);
        if (isCorrect) correctAnswersCount += question.weight;
        console.log("Correct answers count:", correctAnswersCount);

        const { error: questionResponseError } = await supabase
          .from("question_responses")
          .insert({
            quizResponseId: quizResponse.id,
            questionId: question.id,
            answer: userAnswer,
            isCorrect: isCorrect,
            feedback: questionFeedback.feedback,
          });

        if (questionResponseError) {
          console.error(
            "Error saving question response:",
            questionResponseError
          );
          return new Response(
            JSON.stringify({ error: "Failed to save question response" }),
            { status: 500 }
          );
        }
      }
    }

    const { error: updateError } = await supabase
      .from("quiz_responses")
      .update({ score: correctAnswersCount, feedback: generalFeedback })
      .eq("id", quizResponse.id);

    if (updateError) {
      console.error("Error updating score and feedback:", updateError);
    }

    return new Response(
      JSON.stringify({
        email,
        results,
        score: correctAnswersCount,
        generalFeedback,
      })
    );
  } catch (error) {
    console.error("Error generating feedback:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate feedback" }),
      { status: 500 }
    );
  }
}
