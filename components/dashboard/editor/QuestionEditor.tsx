import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEditor } from "@/context/EditorContext";
import { Question } from "@/lib/types/editorTypes";
import { IconTrash } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import React from "react";
import { Label } from "@/components/ui/label";
import AnswerEditor from "./AnswerEditor";
import { ALPHABET } from "@/lib/constants/editor";

interface Props {
  data: Question;
  index: number;
}

export default function QuestionEditor({ index, data }: Props) {
  const { quiz, updateQuiz } = useEditor();

  return (
    <div
      className={`w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300 `}
    >
      <div className="w-full flex gap-2">
        <Input
          placeholder="Pregunta"
          value={data.title}
          onChange={(e) => {
            const newQuestions = quiz?.questions.map((q, i) =>
              i === index ? { ...q, title: e.target.value } : q
            );
            updateQuiz("questions", newQuestions);
          }}
          className="text-xl font-bold border-0 focus:border-2"
          onClick={(e) => {
            e.currentTarget.select();
          }}
        />

        <Select
          disabled
          value={data.type}
          onValueChange={(e) => {
            const newQuestions = quiz?.questions.map((q, i) =>
              i === index ? { ...q, type: e } : q
            );
            updateQuiz("questions", newQuestions);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de pregunta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiple">Selección múltiple</SelectItem>
            <SelectItem value="trufalse">Verdadero o falso</SelectItem>
            <SelectItem value="open">Respuesta abierta</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={() => {
            const newQuestions = quiz?.questions.filter((_, i) => i !== index);
            updateQuiz("questions", newQuestions);
          }}
        >
          <IconTrash size={24} />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {data.type === "multiple" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <RadioGroup
                defaultValue={
                  data.options.findIndex((o) => o.correct) !== -1
                    ? data.options.findIndex((o) => o.correct).toString()
                    : "0"
                }
                onValueChange={(value) => {
                  const newOptions = data.options.map((o, i) => ({
                    ...o,
                    correct: ALPHABET[i] === value,
                  }));
                  const newQuestions = quiz?.questions.map((q, i) =>
                    i === index ? { ...q, options: newOptions } : q
                  );
                  updateQuiz("questions", newQuestions);
                }}
              >
                {data.options.map((option, i) => (
                  <AnswerEditor
                    key={i}
                    type={data.type}
                    option={option}
                    question={data}
                  />
                ))}
              </RadioGroup>
            </div>
            <div className="">
              <Button
                variant={"default"}
                onClick={() => {
                  const newQuestions = quiz?.questions.map((q, i) =>
                    i === index
                      ? {
                          ...q,
                          options: [
                            ...q.options,
                            {
                              id: ALPHABET[q.options.length],
                              title: "",
                              description: "",
                              correct: false,
                            },
                          ],
                        }
                      : q
                  );
                  updateQuiz("questions", newQuestions);
                }}
              >
                Agregar opción
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
