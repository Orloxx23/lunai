import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { useEditor } from "@/context/EditorContext";
import { ALPHABET } from "@/lib/constants/editor";
import { Option, Question } from "@/lib/types/editorTypes";
import { IconX } from "@tabler/icons-react";
import React, { useState } from "react";

interface Props {
  type?: Question["type"];
  option: Option;
  question: Question;
}

export default function AnswerEditor({
  type = "multiple",
  option,
  question,
}: Props) {
  const { quiz, updateQuiz } = useEditor();

  if (type === "multiple") {
    return (
      <div className="flex items-center space-x-2">
        <RadioGroupItem
          value={ALPHABET[question.options.indexOf(option)]}
          id={question.title + "-" + question.options.indexOf(option)}
        />

        <Input
          placeholder="Escribe una respuesta"
          value={option.title}
          onChange={(e) => {
            const newOptions = question.options.map((o, i) =>
              i === question.options.indexOf(option)
                ? { ...o, title: e.target.value }
                : o
            );

            updateQuiz("questions", [
              ...(quiz?.questions ?? []).map((q) =>
                q.id === question.id ? { ...q, options: newOptions } : q
              ),
            ]);
          }}
          className="border-0 outline-0 ring-0 p-0 h-fit rounded"
          onClick={(e) => e.currentTarget.select()}
        />

        <Button
          variant={"ghost"}
          onClick={() => {
            const newOptions = question.options.filter(
              (o) => o.id !== option.id
            );

            updateQuiz("questions", [
              ...(quiz?.questions ?? []).map((q) =>
                q.id === question.id ? { ...q, options: newOptions } : q
              ),
            ]);
          }}
        >
          <IconX size={20} />
        </Button>
      </div>
    );
  }
}
