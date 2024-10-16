"use client";

import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";

export default function ReviewPage({
  params,
}: {
  params: { responseId: string };
}) {
  const supabase = createClient();
  const [questionsData, setQuestionsData] = useState<
    {
      userAnswer: any;
      id: any;
      title: any;
      description: any;
      type: any;
      options: { id: any; title: any; isCorrect: any }[];
    }[]
  >([]);

  useEffect(() => {
    async function fetchData() {
      // Obtener el quizID a partir del responseId
      const { data: response, error: responseError } = await supabase
        .from("quiz_responses")
        .select("quizId")
        .eq("id", params.responseId)
        .single();

      if (responseError) {
        console.error(responseError);
        return;
      }

      // Obtener preguntas y sus opciones del quiz
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, title, description, type, options (id, title, isCorrect)")
        .eq("quizId", response.quizId);

      if (questionsError) {
        console.error(questionsError);
        return;
      }

      // Obtener las respuestas del usuario
      const { data: userResponses, error: userResponsesError } = await supabase
        .from("question_responses")
        .select("questionId, answer")
        .eq("quizResponseId", params.responseId);

      if (userResponsesError) {
        console.error(userResponsesError);
        return;
      }

      // Añadir las respuestas del usuario a las preguntas
      const questionsWithResponses = questions.map((question) => {
        const userResponse = userResponses.find(
          (response) => response.questionId === question.id
        );
        return {
          ...question,
          userAnswer: userResponse?.answer, // Puede ser ID o texto
        };
      });

      setQuestionsData(questionsWithResponses);
    }

    fetchData();
  }, [params.responseId, supabase]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 py-4">
      {questionsData.map((question) => (
        <div key={question.id} className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300">
          <h3 className="text-xl font-medium">{question.title}</h3>
          <p>{question.description}</p>
          {question.type === "open" ? (
            <p className="italic">{question.userAnswer}</p> // Mostrar respuesta abierta
          ) : (
            <ul>
              {question.options.map((option) => (
                <li
                  key={option.id}
                  className={
                    question.userAnswer === option.id ? "font-bold" : ""
                  }
                >
                  {option.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
