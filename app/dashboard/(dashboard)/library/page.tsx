"use client";

import QuizCard from "@/components/dashboard/library/QuizCard";
import { Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import { IconMoonFilled } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LibraryPage() {
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [deleting, setDeleting] = useState(false);

  const getQuizzes = async () => {
    const supabase = createClient();

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;
    console.log("🚀 ~ getQuizzes ~ userId:", userId);

    let { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("authorId", userId);

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
    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", id);

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

  useEffect(() => {
    getQuizzes();
  }, []);

  return (
    <div className="size-full">
      <div className="w-full max-w-7xl mx-auto h-full py-4">
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[9/10.5] flex flex-col rounded-md overflow-hidden bg-background opacity-30 animate-pulse"
                ></div>
              ))
            : quizzes.map((quiz, index) => (
                <QuizCard key={quiz.id} quiz={quiz} deleteQuiz={deleteQuiz} />
              ))}
        </div>
      </div>
    </div>
  );
}
