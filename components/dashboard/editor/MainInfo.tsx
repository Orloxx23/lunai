import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/context/EditorContext";
import { MAX_LENGTH_QUIZ_DESCRIPTION } from "@/lib/constants/editor";
import React from "react";

export default function MainInfo() {
  const { quiz, updateQuiz } = useEditor();

  return (
    <div
      className={`w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300`}
    >
      <Input
        placeholder="Titulo del cuestionario"
        value={quiz?.title}
        onChange={(e) => {
          updateQuiz("title", e.target.value);
        }}
        className="text-2xl font-bold border-0 focus:border-2"
      />
      <div className="relative">
        <Textarea
          placeholder="Descripción del cuestionario"
          value={quiz?.description}
          onChange={(e) => {
            updateQuiz("description", e.target.value);
          }}
          className="text-sm border-0 focus:border-2 resize-none"
          maxLength={MAX_LENGTH_QUIZ_DESCRIPTION}
        />
        <span className="absolute bottom-2 right-2 text-xs opacity-50">
          {quiz?.description.length || 0}/{MAX_LENGTH_QUIZ_DESCRIPTION}
        </span>
      </div>
    </div>
  );
}
