"use client";

import React, { useEffect, useState } from "react";
import MainInfo from "./MainInfo";
import { useEditor } from "@/context/EditorContext";
import QuestionEditor from "./QuestionEditor";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { Quiz } from "@/lib/types/editorTypes";
import Responses from "./Responses";

interface Props {
  quiz: Quiz;
}

export default function EditorBody({ quiz }: Props) {
  const { setQuiz, updateQuiz, questions, createQuestion } = useEditor();
  const [view, setView] = useState<"editor" | "responses">("editor");

  useEffect(() => {
    setQuiz(quiz);
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
          Editor
        </Button>
        <Button
          variant={view === "responses" ? "default" : "ghost"}
          onClick={() => {
            setView("responses");
          }}
          className="w-full"
        >
          Responses
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

      <Responses view={view} />
    </div>
  );
}
