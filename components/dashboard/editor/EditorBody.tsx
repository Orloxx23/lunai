"use client";

import React, { useEffect, useState } from "react";
import MainInfo from "./MainInfo";
import { useEditor } from "@/context/EditorContext";
import QuestionEditor from "./QuestionEditor";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { Quiz } from "@/lib/types/editorTypes";
import Responses from "./Responses";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

interface Props {
  quiz: Quiz;
}

export default function EditorBody({ quiz }: Props) {
  const { setQuiz, updateQuiz, questions, createQuestion } = useEditor();
  const [view, setView] = useState<"editor" | "responses">("editor");
  const [responses, setResponses] = useState<any[]>([]);

  const supabase = createClient();

  const getResponses = async () => {
    const { data, error } = await supabase
      .from("quiz_responses")
      .select("*")
      .eq("quizId", quiz?.id);

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setResponses(data);
    }
  };

  useEffect(() => {
    setQuiz(quiz);
    getResponses();
  }, []);

  useEffect(() => {
    const myChannel = supabase
      .channel(quiz.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "question_responses" },
        (payload) => {
          getResponses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(myChannel);
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="w-full p-2 bg-background flex gap-2 rounded-md border border-boeder">
        <Button
          variant={view === "editor" ? "default" : "ghost"}
          onClick={() => {
            setView("editor");
          }}
          className="w-full"
        >
          Preguntas
        </Button>
        <Button
          variant={view === "responses" ? "default" : "ghost"}
          onClick={() => {
            setView("responses");
          }}
          className="w-full flex gap-1 items-center"
        >
          <span>Respuestas</span>{" "}
          {responses.length > 0 && (
            <span className="px-2 py-0.5 bg-accent-foreground/80 text-accent rounded-xl">
              {responses.length}
            </span>
          )}
        </Button>
      </div>

      <div className={`flex flex-col gap-4 ${view !== "editor" && "hidden"}`}>
        <MainInfo />

        {questions?.map((question, index) => (
          <QuestionEditor key={question.id} index={index} data={question} />
        ))}

        <Button
          variant={"default"}
          onClick={() => {
            createQuestion();
          }}
        >
          <IconPlus size={24} />
        </Button>
      </div>

      <Responses view={view} responses={responses} />
    </div>
  );
}
