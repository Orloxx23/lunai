import { createClient } from "@/utils/supabase/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

type Answer = Record<string, string>;

type QuestionOption = {
  id: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  options: QuestionOption[];
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
  const prompt = `Pregunta: ${question}\nRespuesta del usuario: ${userAnswer}\n¿Es correcta?: ${isCorrect ? "Sí" : "No"}\nGenera un feedback personalizado basado en esta información. no saludes. en español. en texto plano. hablale directamente al usuario.`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: prompt,
    temperature: 1,
  });

  return text;
}

async function generateGeneralFeedback(
  totalQuestions: number,
  correctAnswers: number
): Promise<string> {
  const prompt = `El usuario respondió a ${totalQuestions} preguntas y acertó ${correctAnswers}. Genera un feedback general sobre el rendimiento del usuario, darle algunos ejemplos o información util sobre el tema, hablandole diractemenre a el. No saludes. en español. en texto plano. pero hazlo de manera muy resumida.`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: prompt,
    temperature: 1,
  });

  return text;
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

  // Obtener el ID del usuario basado en el email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  /*if (userError || !user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }*/

  // Crear una nueva entrada en quiz_responses para registrar el intento del usuario
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

  // Obtener todas las preguntas del quiz junto con sus opciones
  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, title, options(id, title, isCorrect)") // Asegúrate de seleccionar el título de la opción
    .eq("quizId", quizId);

  if (questionError || !questions) {
    return new Response(JSON.stringify({ error: "Error fetching questions" }), {
      status: 500,
    });
  }

  // Procesar respuestas del usuario
  const results: ValidationResult[] = [];
  let correctAnswersCount = 0; // Contador de respuestas correctas

  for (const questionId in answers) {
    const userAnswer = answers[questionId];
    const question = questions.find((q: Question) => q.id === questionId);

    if (!question) {
      continue;
    }

    // Buscar si la respuesta coincide con alguna opción
    const option = question.options.find(
      (opt: QuestionOption) => opt.id === userAnswer
    );
    const isCorrect = option ? option.isCorrect : false;

    // Si la respuesta es correcta, aumentar el contador
    if (isCorrect) {
      correctAnswersCount++;
    }

    // Generar feedback con IA para la pregunta usando el título de la opción en vez del ID
    const feedback = await generateFeedback(
      question.title, // Título de la pregunta
      option ? option.title : userAnswer, // Título de la opción seleccionada
      isCorrect
    );

    // Guardar la respuesta en question_responses
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

    // Almacenar el resultado en el array para el usuario
    results.push({
      questionId: question.id,
      userAnswer,
      isCorrect,
      feedback,
    });
  }

  // Generar feedback general
  const generalFeedback = await generateGeneralFeedback(
    questions.length,
    correctAnswersCount
  );

  // Actualizar el score y feedback general en quiz_responses
  const { error: updateError } = await supabase
    .from("quiz_responses")
    .update({ score: correctAnswersCount, feedback: generalFeedback }) // Asegúrate de que la tabla tenga una columna "feedback"
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
