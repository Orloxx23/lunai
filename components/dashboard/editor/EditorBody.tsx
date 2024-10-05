"use client";

import React, { useEffect, useState } from "react";
import MainInfo from "./MainInfo";
import { useEditor } from "@/context/EditorContext";
import QuestionEditor from "./QuestionEditor";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

export default function EditorBody() {
  const { quiz, updateQuiz } = useEditor();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <MainInfo />

      {quiz?.questions.map((question, index) => (
        <QuestionEditor
          key={"quesiton-" + index}
          index={index}
          data={question}
        />
      ))}

      <Button
        variant={"default"}
        onClick={() => {
          updateQuiz("questions", [
            ...(quiz?.questions || []),
            {
              title: "",
              type: "multiple",
              options: [
                {
                  id: "a",
                  title: "",
                  correct: false,
                },
              ],
              correct: "",
            },
          ]);
        }}
      >
        <IconPlus size={24} />
      </Button>
    </div>
  );
}
