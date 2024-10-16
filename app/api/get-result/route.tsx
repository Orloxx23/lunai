import { createClient } from "@/utils/supabase/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

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

async function generateFeedback(
  question: string,
  userAnswer: string,
  isCorrect: boolean
): Promise<string> {
  const prompt = `Pregunta: ${question}\nRespuesta del usuario: ${userAnswer}\n¿Es correcta?: ${isCorrect ? "Sí" : "No"}\nGenera un feedback personalizado basado en esta información. No saludes. En español. En texto plano. Háblale directamente al usuario.`;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
    temperature: 1,
  });

  return text;
}

async function generateGeneralFeedback(
  totalQuestions: number,
  correctAnswers: number,
  questions: {
    title: string;
    options: { title: string; isCorrect: boolean }[];
  }[]
): Promise<string> {
  const questionSummaries = questions
    .map((q) => {
      const correctOption = q.options.find((opt) => opt.isCorrect);
      return `Pregunta: ${q.title}\nRespuesta correcta: ${correctOption?.title || "N/A"}`;
    })
    .join("\n\n");

  const prompt = `El usuario respondió a ${totalQuestions} preguntas y acertó ${correctAnswers}. Aquí hay un resumen de las preguntas y las respuestas correctas:\n\n${questionSummaries}\n\nGenera un feedback general sobre el rendimiento del usuario, mencionando algunas de estas preguntas si es útil. No saludes, háblale directamente al usuario en español y de manera resumida. Response en markdown.`;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
    temperature: 1,
  });

  return text;
}

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

  const { data: quizResponse, error: quizResponseError } = await supabase
    .from("quiz_responses")
    .insert({ userId: user?.id, quizId: quizId, score: 0, email: email })
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

  for (const questionId in answers) {
    const userAnswer = answers[questionId];
    const question = questions.find((q: any) => q.id === questionId);

    if (!question) {
      continue;
    }

    let isCorrect = false;
    let feedback = "";

    if (question.type === "multiple") {
      const questionOptions = options.filter(
        (opt: QuestionOption) => opt.questionId === questionId
      );
      const option = questionOptions.find(
        (opt: QuestionOption) => opt.id === userAnswer
      );

      isCorrect = option ? option.isCorrect : false;
      feedback = await generateFeedback(
        question.title,
        option ? option.title : userAnswer,
        isCorrect
      );
    } else if (question.type === "open") {
      if (question.correctAnswer) {
        isCorrect =
          userAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
      } else {
        // Si no hay una respuesta correcta definida, dejamos que la IA decida
        isCorrect = await decideWithAI(question.title, userAnswer);
      }

      feedback = await generateFeedback(question.title, userAnswer, isCorrect);
    }

    const { error: questionResponseError } = await supabase
      .from("question_responses")
      .insert({
        quizResponseId: quizResponse.id,
        questionId: question.id,
        answer: userAnswer,
        isCorrect: isCorrect,
        feedback,
      });

    if (questionResponseError) {
      console.error("Error saving question response:", questionResponseError);
      return new Response(
        JSON.stringify({ error: "Failed to save question response" }),
        { status: 500 }
      );
    }

    results.push({
      questionId: question.id,
      userAnswer,
      isCorrect,
      feedback,
    });

    if (isCorrect) correctAnswersCount++;
  }

  const generalFeedback = await generateGeneralFeedback(
    questions.length,
    correctAnswersCount,
    questions.map((q: any) => {
      const questionOptions = options.filter(
        (opt: QuestionOption) => opt.questionId === q.id
      );
      return {
        title: q.title,
        options: questionOptions.map((opt: QuestionOption) => ({
          title: opt.title,
          isCorrect: opt.isCorrect,
        })),
      };
    })
  );

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
}

async function decideWithAI(question: string, userAnswer: string): Promise<boolean> {
  const prompt = `Pregunta: ${question}\nRespuesta del usuario: ${userAnswer}\nDecide si esta respuesta es correcta o no. Solo responde "correcta" o "incorrecta".`;
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
    temperature: 0.7,
  });

  return text.trim().toLowerCase() === "correcta";
}
