"use client";

import React, { useEffect, useState } from "react";
import MainInfo from "./MainInfo";
import { useEditor } from "@/context/EditorContext";
import QuestionEditor from "./QuestionEditor";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { Quiz } from "@/lib/types/editorTypes";

interface Props {
  quiz: Quiz;
}

export default function EditorBody({ quiz }: Props) {
  const { setQuiz, updateQuiz, questions, createQuestion } = useEditor();

  useEffect(() => {
    setQuiz(quiz);
  }, []);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <MainInfo />

      {questions?.map((question, index) => (
        <QuestionEditor
          key={question.id}
          index={index}
          data={question}
        />
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
  );
}
