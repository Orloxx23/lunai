import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { useEditor } from "@/context/EditorContext";
import useDebounced from "@/hooks/use-debounced";
import { ALPHABET } from "@/lib/constants/editor";
import { Option, Question } from "@/lib/types/editorTypes";
import { IconX } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";

interface Props {
  type?: Question["type"];
  option: Option;
  question: Question;
  updateOption: (
    optionId: string,
    key: keyof Option,
    value: any,
    questionId: string
  ) => void;
  deleteOption: (optionId: string, questionId: string) => void;
}

export default function AnswerEditor({
  type = "multiple",
  option,
  question,
  updateOption,
  deleteOption,
}: Props) {
  const {} = useEditor();

  const [optionData, setOptionData] = useState(option);

  const debouncedOptionData = useDebounced(optionData, 700);

  useEffect(() => {
    if (debouncedOptionData) {
      updateOption(option.id, "title", debouncedOptionData.title, question.id);
    }
  }, [debouncedOptionData]);

  if (type === "multiple") {
    return (
      <div className="flex items-center space-x-2">
        <RadioGroupItem value={option.id} id={option.id} />

        <Input
          placeholder="Escribe una respuesta"
          value={optionData.title}
          onChange={(e) => {
            setOptionData({ ...optionData, title: e.target.value });
          }}
          className="border-0 outline-0 ring-0 p-0 h-fit rounded"
        />

        <Button variant={"ghost"} onClick={() => {
          deleteOption(option.id, question.id);
        }}>
          <IconX size={20} />
        </Button>
      </div>
    );
  }
}
