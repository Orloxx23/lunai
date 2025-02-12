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

  const results: ValidationResult[] = [];
  let correctAnswersCount = 0;

  // Preparar el payload para el feedback
  const feedbackPayload = questions.map((question: any) => {
    const userAnswer = answers[question.id];
    const questionOptions = options.filter(
      (opt: QuestionOption) => opt.questionId === question.id
    );
    const correctOption = questionOptions.find(
      (opt: QuestionOption) => opt.isCorrect
    );

    // Para preguntas de opción múltiple, isCorrect se basa en la opción seleccionada
    const isCorrect =
      question.type === "multiple"
        ? questionOptions.some(
            (opt: QuestionOption) => opt.id === userAnswer && opt.isCorrect
          )
        : null; // Para preguntas abiertas, isCorrect lo decide la IA

    return {
      questionId: question.id,
      question: question.title,
      userAnswer,
      correctAnswer: correctOption?.title || question.correctAnswer,
      type: question.type, // Incluimos el tipo de pregunta en el payload
      isCorrect, // Solo se usa para preguntas de opción múltiple
    };
  });

  try {
    const { object: feedbackResult } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: feedbackSchema,
      prompt: `Eres un experto pedagogo. Estas son las respuestas proporcionadas por el usuario:\n\n${JSON.stringify(feedbackPayload)}\n\nPor favor, genera un feedback general dirigido al usuario, explicando con detalle en qué áreas tuvo un buen desempeño y en cuáles necesita mejorar. Asegúrate de ser claro y específico, proporcionando ejemplos concretos de lo que hizo bien y lo que podría hacer de manera diferente. Usa un tono positivo y constructivo, utilizando frases como: 'Has demostrado...', 'Lograste...', 'Es importante que trabajes en...', 'Podrías mejorar en...'.

Incluye sugerencias claras y prácticas que el usuario pueda implementar para mejorar en las áreas donde falló. Si detectas patrones o problemas recurrentes en sus respuestas, menciónalos de manera explícita. Además, al final del feedback general, genera una lista de temas o conceptos específicos que el usuario debería estudiar, basándote en las áreas donde tuvo fallos. Estos temas deben ser concretos y relacionados con las preguntas o áreas en las que necesita mejorar.

Nota importante para la revisión: Para las respuestas abiertas o de texto (aquellas que no son UUID), ten en cuenta que la respuesta correcta no es una coincidencia exacta, sino una idea general o ejemplos. Por ejemplo, si la respuesta correcta es "Aguardiente, café, colombiana", no esperamos que el usuario responda exactamente eso, sino que su respuesta esté alineada con esa idea general. Si la respuesta del usuario es "Aguardiente", "café" o cualquier otra bebida típica de Colombia, la respuesta debe considerarse correcta. Evalúa si la respuesta del usuario es válida basándote en el contenido y no en una coincidencia exacta.

Además, ten en cuenta lo que se solicita en la pregunta. Si la pregunta pide mencionar solo una cosa (por ejemplo, "Nombra una de las bebidas típicas de Colombia"), el feedback no debe pedirle al usuario que mencione más ejemplos, ya que eso iría en contra de las instrucciones de la pregunta. En su lugar, el feedback debe centrarse en si la respuesta proporcionada es válida y, si es necesario, ofrecer sugerencias adicionales sin contradecir la consigna de la pregunta.

Para las respuestas correctas (incluyendo respuestas abiertas correctas), no es necesario ofrecer feedback sobre áreas de mejora. Solo incluye una felicitación breve y positiva, como por ejemplo: '¡Bien hecho!' o '¡Excelente trabajo!'.

Finalmente, genera un feedback individual para cada pregunta, explicando con precisión en qué destacó el usuario, qué aspectos específicos debería mejorar, y cómo puede ajustar su enfoque en preguntas similares en el futuro, es importante que le digas al usuario cual era la respuesta correcta y/o por que se ha equivocado. Además, para cada pregunta, indica si la respuesta del usuario es correcta o no (isCorrect). Para preguntas de opción múltiple, usa el valor de isCorrect proporcionado en el payload. Para preguntas abiertas, decide si la respuesta es correcta o no basándote en la idea general proporcionada en la respuesta correcta.`,
    });

    const { generalFeedback, questionFeedbacks } = feedbackResult;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const questionFeedback = questionFeedbacks.find(
        (fb: any) => fb.questionId === question.id
      );

      if (questionFeedback) {
        // Para preguntas de opción múltiple, usamos el isCorrect del payload
        // Para preguntas abiertas, usamos el isCorrect generado por la IA
        const isCorrect =
          question.type === "multiple"
            ? feedbackPayload.find((fb: any) => fb.questionId === question.id)
                ?.isCorrect
            : questionFeedback.isCorrect;

        results.push({
          questionId: question.id,
          userAnswer,
          isCorrect: isCorrect || false,
          feedback: questionFeedback.feedback,
        });

        if (isCorrect) correctAnswersCount++;

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
