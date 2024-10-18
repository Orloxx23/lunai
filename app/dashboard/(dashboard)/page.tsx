"use client";

import QuizCard from "@/components/dashboard/library/QuizCard";
import ReponseCard from "@/components/dashboard/library/ReponsesCard";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import { IconLoader2, IconMoonFilled, IconPlus } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LibraryPage() {
  const { createQuiz, creating } = useEditor();

  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [deleting, setDeleting] = useState(false);

  const [responses, setResponses] = useState<any>([]);

  const getQuizzes = async () => {
    const supabase = createClient();

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;

    let { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("authorId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching quizzes", error);
    }

    if (quizzes) {
      setQuizzes(quizzes);
      setLoading(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    setDeleting(true);

    // Obtenemos el quiz a eliminar de la lista con su index, lo sacamos de la lista y actualizamos el estado, si hay un error lo agregamos de nuevo en su posicion anterior
    const index = quizzes.findIndex((quiz) => quiz.id === id);
    const quiz = quizzes[index];
    const newQuizzes = quizzes.filter((quiz) => quiz.id !== id);

    setQuizzes(newQuizzes);

    const supabase = createClient();
    const { error } = await supabase.from("quizzes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting quiz", error);
      toast.error("Error al eliminar el quiz");
      // Si hay un error lo agregamos de nuevo en su posicion anterior, pero no podemos permitir que se repita el id
      setQuizzes([
        ...newQuizzes.slice(0, index),
        quiz,
        ...newQuizzes.slice(index),
      ]);
    }

    setTimeout(() => {
      setDeleting(false);
    }, 2000);
  };

  const getQuizzesResponses = async () => {
    try {
      const supabase = createClient();
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;

      // Obtener todas las respuestas del usuario junto con los datos del cuestionario
      let { data: quizResponses, error } = await supabase
        .from("quiz_responses")
        .select("*, quizzes(*)") // Asumimos que existe una relación con la tabla quizzes
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Error fetching quiz responses: ", error);
        return;
      }

      if (quizResponses) {
        setResponses(
          quizResponses.map((response: any) => ({
            response, // Respuesta del usuario
          }))
        );
      }
    } catch (err) {
      console.error("Unexpected error: ", err);
    }
  };

  useEffect(() => {
    getQuizzes();
    getQuizzesResponses();
  }, []);

  return (
    <div className="size-full">
      <div className="w-full max-w-7xl mx-auto h-full py-4 flex flex-col gap-8">
        <div className="flex flex-col gap-0">
          <p className="font-bold text-xl px-2">Mis Cuestionatios</p>
          <div className="w-full flex gap-4 overflow-x-auto py-4 px-2">
            <Button
              disabled={creating || loading}
              variant={"default"}
              onClick={createQuiz}
              className="min-w-52 w-52 h-64"
            >
              {creating ? (
                <IconLoader2 size={32} className="animate-spin" />
              ) : (
                <IconPlus size={32} />
              )}
            </Button>

            {loading
              ? Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={index}
                    className="min-w-52 w-52 h-64 flex flex-col rounded-md overflow-hidden bg-background opacity-30 animate-pulse"
                  ></div>
                ))
              : quizzes.map((quiz, index) => (
                  <QuizCard key={quiz.id} quiz={quiz} deleteQuiz={deleteQuiz} />
                ))}
          </div>
        </div>
        <div className="flex flex-col gap-0">
          <p className="font-bold text-xl px-2">Mis respuestas</p>
          <div className="w-full flex gap-4 overflow-x-auto py-4 px-2">
            {loading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="min-w-52 w-52 h-64 flex flex-col rounded-md overflow-hidden bg-background opacity-30 animate-pulse"
                ></div>
              ))
            ) : responses.length > 0 ? (
              responses.map((response: any, index: number) => (
                <ReponseCard
                  key={response.id}
                  response={response}
                  quiz={{} as Quiz}
                />
              ))
            ) : (
              <p className="text-muted-foreground">No hay respuestas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
