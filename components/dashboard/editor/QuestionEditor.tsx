import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/context/EditorContext";
import useDebounced from "@/hooks/use-debounced";
import { generateUUID } from "@/lib/functions/editor";
import { Option, Question } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import {
  IconGripHorizontal,
  IconNumber100Small,
  IconPhoto,
  IconProgressCheck,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import AnswerEditor from "./AnswerEditor";
import UploadContentOnQuestion from "./UploadContentOnQuestion";
import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";

interface Props {
  data: Question;
  index?: number;
}

export default function QuestionEditor({ index, data }: Props) {
  const supabase = createClient();
  const {
    deleteQuestion,
    updateQuestion,
    setSaving,
    generatedOptions,
    quiz,
    updateQuestionWeight,
    calculateWeight,
    autoScoring,
  } = useEditor();

  const [questionData, setQuestionData] = useState<Question>(data);
  const debouncedQuestionData = useDebounced(questionData, 700);
  const [options, setOptions] = useState<Option[]>([]);
  const [tempSelectedOption, setTempSelectedOption] = useState<string | null>(
    options.find((o) => o.isCorrect)?.id || ""
  );
  const [weight, setWeight] = useState<number>(100);

  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: data.id,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

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
    const { error } = await supabase.from("options").insert([newOption]);

    if (error) {
      console.error("Error creating option", error);
      setOptions((prev) => prev.filter((o) => o.id !== newOption.id));
    }
  };

  const deleteOption = async (optionId: string, questionId: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== optionId));

    const supabase = createClient();
    const { error } = await supabase
      .from("options")
      .delete()
      .eq("id", optionId);

    if (error) {
      console.error("Error deleting option", error);
      getOptions(questionId);
    }
  };

  const updateOption = async (
    optionId: string,
    key: keyof Option,
    value: any,
    questionId: string
  ) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === optionId ? { ...o, [key]: value } : o))
    );
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("options")
      .update({ [key]: value })
      .eq("id", optionId);

    if (error) {
      console.error("Error updating option", error);
      getOptions(questionId);
    }

    setSaving(false);
  };

  const getQuestion = async () => {
    const { data: _question, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", data?.id)
      .single();

    if (error) {
      console.error("Error getting question", error);
    }

    if (_question) {
      setQuestionData(_question);
    }
  };

  const removeImage = async () => {
    setQuestionData({ ...questionData, image: "" });

    const { error } = await supabase
      .from("questions")
      .update({ image: null })
      .eq("id", data.id);

    if (error) {
      console.error("Error removing image", error);
    }

    const imgName = questionData?.image?.split("/").pop();

    const { error: deleteError } = await supabase.storage
      .from("contents")
      .remove([`${data.quizId}/${imgName}`]);

    if (deleteError) {
      console.error("Error deleting image", deleteError);
    }

    getQuestion();
  };

  useEffect(() => {
    if (data) {
      getOptions(data.id);
      setWeight(data.weight);
    }
  }, [data]);

  useEffect(() => {
    setOptions((prev) => {
      const existingOptions = prev.filter((o) => o.questionId === data.id);
      const newOptions = generatedOptions.filter(
        (o) =>
          o.questionId === data.id &&
          !existingOptions.some((eo) => eo.id === o.id)
      );
      return [...prev, ...newOptions];
    });
  }, [generatedOptions]);

  useEffect(() => {
    if (debouncedQuestionData) {
      updateQuestion(data.id, "title", debouncedQuestionData.title);
    }
  }, [debouncedQuestionData]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 group relative"
    >
      <div className="absolute w-full flex justify-center items-center active:cursor-grabbing opacity-0 group-hover:opacity-100 -translate-y-4">
        <div
          className="w-fit cursor-grab active:cursor-grabbing text-foreground/20"
          {...listeners}
          {...attributes}
        >
          <IconGripHorizontal size={16} />
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div className="w-full flex gap-2 items-center justify-end flex-wrap">
          <UploadContentOnQuestion question={data} callback={getQuestion} />

          <Select
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
              <SelectItem value="open">Respuesta abierta</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-fit flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <Input
              value={weight}
              onChange={(e) => {
                setWeight(parseFloat(e.target.value));
                updateQuestionWeight(data.id, parseFloat(e.target.value));
              }}
              type="number"
              className="w-12 p-0 h-fit m-0 outline-0 border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
              step={0.01}
              min={0}
              disabled={autoScoring}
            />
            <button
              onClick={() => {
                const newWeight = calculateWeight(weight);
                setWeight(newWeight);
                updateQuestionWeight(data.id, parseFloat(newWeight.toFixed(2)));
              }}
              disabled={autoScoring}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconProgressCheck size={18} />
            </button>
          </div>

          <div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                deleteQuestion(data.id);
              }}
            >
              <IconTrash size={24} />
            </Button>
          </div>
        </div>

        {questionData.image && (
          <div className="relative w-full max-h-96 bg-accent rounded-lg overflow-hidden">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <IconX size={18} />
            </Button>
            <img
              src={questionData.image}
              alt="question"
              className="w-full h-full object-contain rounded-lg"
              draggable={false}
            />
          </div>
        )}

        <Textarea
          placeholder="Pregunta"
          value={questionData.title}
          onChange={(e) => {
            setQuestionData({ ...questionData, title: e.target.value });
          }}
          className="text-xl font-bold border-0 focus:border-2 resize-none"
        />
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
                variant="default"
                onClick={() => {
                  createOption(data.id);
                }}
              >
                Agregar opción
              </Button>
            </div>
          </div>
        )}

        {data.type === "open" && (
          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="Respuesta modelo (opcional)"
              value={data.correctAnswer}
              onChange={(e) => {
                updateQuestion(data.id, "correctAnswer", e.target.value);
              }}
              className="resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
