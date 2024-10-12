import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEditor } from "@/context/EditorContext";
import { Option, Question } from "@/lib/types/editorTypes";
import { IconTrash } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import AnswerEditor from "./AnswerEditor";
import { ALPHABET } from "@/lib/constants/editor";
import useDebounced from "@/hooks/use-debounced";
import { createClient } from "@/utils/supabase/client";
import { generateUUID } from "@/lib/functions/editor";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  data: Question;
  index: number;
}

export default function QuestionEditor({ index, data }: Props) {
  const { quiz, updateQuiz, deleteQuestion, updateQuestion, setSaving, generatedOptions } =
    useEditor();

  const [questionData, setQuestionData] = useState<Question>(data);

  const debouncedQuestionData = useDebounced(questionData, 700);

  const [options, setOptions] = useState<Option[]>([]);

  const [tempSelectedOption, setTempSelectedOption] = useState<string | null>(
    options.find((o) => o.isCorrect)?.id || ""
  );

  const getOptions = async (questionId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("options")
      .select("*")
      .eq("questionId", questionId);

    if (error) {
      console.error("Error getting options", error);
    }

    if (data) {
      setOptions(data);
      setTempSelectedOption(data.find((o) => o.isCorrect)?.id || "");
    }

    return [];
  };

  const createOption = async (questionId: string) => {
    const newOption: Option = {
      id: generateUUID(),
      title: "",
      description: "",
      isCorrect: false,
      questionId: questionId || "",
    };

    setOptions((prev) => [...prev, newOption]);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("options")
      .insert([newOption])
      .select();

    if (error) {
      console.error("Error creating option", error);
      setOptions((prev) => prev.filter((o) => o.id !== newOption.id));
    }

    if (data) {
      console.log("Option created", data);
    }
  };

  const deleteOption = async (optionId: string, questionId: string) => {
    const optionToDelete: Option | null | undefined = options.find(
      (o) => o.id === optionId
    );

    // Filtra la pregunta a eliminar
    const tempOptions = options.filter((o) => o.id !== optionId);
    setOptions(tempOptions);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("options")
      .delete()
      .eq("id", optionId)
      .select();

    if (error) {
      console.error("Error deleting option", error);
      getOptions(questionId);
    }

    if (data) {
      console.log("Option deleted", data);
    }
  };

  const updateOption = async (
    optionId: string,
    key: keyof Option,
    value: any,
    questionId: string
  ) => {
    const optionToUpdate: Option | null | undefined = options.find(
      (o) => o.id === optionId
    );

    if (!optionToUpdate) return;

    const newOptions = options.map((o) =>
      o.id === optionId
        ? {
            ...o,
            [key]: value,
          }
        : o
    );

    setOptions(newOptions);
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("options")
      .update({ [key]: value })
      .eq("id", optionId)
      .select();

    if (error) {
      console.error("Error updating option", error);
      getOptions(questionId);
    }

    if (data) {
      console.log("Option updated", data);
    }

    setSaving(false);
  };

  useEffect(() => {
    if (data) {
      getOptions(data.id);
    }
  }, [data]);

  useEffect(() => {
    setOptions((prev) => [
      ...prev,
      ...generatedOptions.filter((o) => o.questionId === data.id),
    ])
  }, [generatedOptions]);

  useEffect(() => {
    if (debouncedQuestionData) {
      updateQuestion(data.id, "title", debouncedQuestionData.title);
    }
  }, [debouncedQuestionData]);

  return (
    <div
      className={`w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300 `}
    >
      <div className="w-full flex gap-2">
        <Textarea
          placeholder="Pregunta"
          value={questionData.title}
          onChange={(e) => {
            setQuestionData({ ...questionData, title: e.target.value });
          }}
          className="text-xl font-bold border-0 focus:border-2 resize-none"
        />

        {/* <Select
          disabled
          value={data.type}
          onValueChange={(e) => {
            updateQuestion(data.id, "type", e);
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
        </Select> */}

        <div>
          <Button
            variant={"ghost"}
            size={"icon"}
            onClick={() => {
              deleteQuestion(data.id);
            }}
          >
            <IconTrash size={24} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {data.type === "multiple" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <RadioGroup
                defaultValue={options.find((o) => o.isCorrect)?.id || ""}
                value={tempSelectedOption || ""}
                onValueChange={(value) => {
                  options.forEach((o) => {
                    const isCorrect = o.id === value;
                    updateOption(o.id, "isCorrect", isCorrect, data.id);
                  });
                  setTempSelectedOption(value);
                }}
              >
                {options.map((option) => (
                  <AnswerEditor
                    key={option.id}
                    type={data.type}
                    option={option}
                    question={data}
                    updateOption={updateOption}
                    deleteOption={deleteOption}
                  />
                ))}
              </RadioGroup>
            </div>
            <div className="">
              <Button
                variant={"default"}
                onClick={() => {
                  createOption(data.id);
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
