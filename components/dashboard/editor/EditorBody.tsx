"use client";

import React, { useEffect, useState } from "react";
import MainInfo from "./MainInfo";
import { useEditor } from "@/context/EditorContext";
import QuestionEditor from "./QuestionEditor";
import { Button } from "@/components/ui/button";
import { IconPlus, IconSparkles } from "@tabler/icons-react";
import { Quiz } from "@/lib/types/editorTypes";
import Responses from "./Responses";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Generator from "./Generator";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";

interface Props {
  quiz: Quiz;
}

export default function EditorBody({ quiz }: Props) {
  const { setQuiz, updateQuiz, questions, setQuestions, createQuestion } =
    useEditor();
  const [view, setView] = useState<"editor" | "responses">("editor");
  const [responses, setResponses] = useState<any[]>([]);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const updatedQuestions = [...questions];
      updatedQuestions.splice(
        newIndex,
        0,
        updatedQuestions.splice(oldIndex, 1)[0]
      );

      setQuestions(updatedQuestions);

      // Swap the positions in Supabase
      const { error: updateError1 } = await supabase
        .from("questions")
        .update({ position: newIndex })
        .eq("id", active.id);

      const { error: updateError2 } = await supabase
        .from("questions")
        .update({ position: oldIndex })
        .eq("id", over.id);

      if (updateError1 || updateError2) {
        console.error(
          "Error updating question positions:",
          updateError1 || updateError2
        );
      }
    }

    document.body.style.cursor = "default";
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

  useEffect(() => {
    console.log(questions);
  }, [questions]);

  return (
    <>
      <Generator
        isOpen={generatorOpen}
        setIsOpen={setGeneratorOpen}
        oneQuestion
      />

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

          <DndContext
            modifiers={[
              restrictToVerticalAxis,
              restrictToFirstScrollableAncestor,
            ]}
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={() => {
              document.body.style.cursor = "grabbing";
            }}
          >
            <SortableContext
              items={questions.map((question, index) => question.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions?.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  index={index}
                  data={question}
                />
              ))}
            </SortableContext>
          </DndContext>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"default"}>
                <IconPlus size={24} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="space-x-1"
                onClick={() => {
                  createQuestion();
                }}
              >
                <IconPlus size={16} />
                <span>Crear nueva pregunta</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="space-x-1"
                onClick={() => {
                  setGeneratorOpen(true);
                }}
              >
                <IconSparkles size={16} />
                <span>Generar pregunta</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Responses view={view} responses={responses} />
      </div>
    </>
  );
}
