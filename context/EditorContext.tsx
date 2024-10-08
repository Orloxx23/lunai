"use client";

import useDebounced from "@/hooks/use-debounced";
import { APP_NAME } from "@/lib/constants/general";
import { generateProjectName } from "@/lib/functions/editor";
import { Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

type MyContextData = {
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz) => void;
  updateQuiz: (key: keyof Quiz, value: any) => void;
  saving: boolean;
  saveQuiz: () => void;
  createQuiz: () => void;
  creating: boolean;
};

const EditorContext = createContext<MyContextData | undefined>(undefined);

const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  let router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>({
    id: "",
    name: "",
    title: "",
    description: "",
    questions: [],
  });

  const [saving, setSaving] = useState(false);
  const [isExternalUpdate, setIsExternalUpdate] = useState(false); // Nuevo estado para detectar cambios externos
  const debouncedQuiz = useDebounced(quiz, 700);

  const updateQuiz = (key: keyof Quiz, value: any) => {
    setQuiz((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const [creating, setCreating] = useState(false);
  const createQuiz = async () => {
    const supabase = createClient();
    setCreating(true);

    const name = await generateProjectName();

    if (!name) return;

    const { data, error } = await supabase
      .from("quizzes")
      .insert([
        {
          name,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating quiz", error);
      setCreating(false);
    }

    if (data) {
      console.log("Quiz created", data);
      setQuiz((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          id: data[0].id,
          name: data[0].name,
        };
      });
      router.push(`/dashboard/editor/${data[0].id}`);
    }

    setTimeout(() => {
      setCreating(false);
    }, 1000);
  };

  const saveQuiz = async () => {
    if (isExternalUpdate) return; // No guardes si es una actualización externa

    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("quizzes")
      .update({
        name: debouncedQuiz?.name,
        title: debouncedQuiz?.title,
        description: debouncedQuiz?.description,
      })
      .eq("id", debouncedQuiz?.id)
      .select();

    if (error) {
      console.error("Error saving quiz", error);
    }

    setSaving(false);
  };

  useEffect(() => {
    const saveIfChanged = async () => {
      console.log("Saving if changed", quiz, debouncedQuiz);
      if (!quiz || !debouncedQuiz || quiz.id !== debouncedQuiz.id) return;

      await saveQuiz();
    };

    document.title = `${quiz?.name || "Cuestionario sin nombre"} - ${APP_NAME}`;

    saveIfChanged();
  }, [debouncedQuiz]);

  useEffect(() => {
    const supabase = createClient();
    const quizzes = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "quizzes" }, // Solo escucha actualizaciones
        (payload) => {
          console.log("Quiz updated", payload);
          const newQuiz = payload.new as Quiz;

          // Cambios externos detectados
          if (
            newQuiz.id !== quiz?.id ||
            newQuiz.name !== quiz.name ||
            newQuiz.title !== quiz.title ||
            newQuiz.description !== quiz.description
          ) {
            setIsExternalUpdate(true); // Cambia el estado a cambio externo
            setQuiz(newQuiz);
            setTimeout(() => setIsExternalUpdate(false), 1000); // Reinicia el estado tras un tiempo
          }
        }
      )
      .subscribe();

    return () => {
      quizzes.unsubscribe();
    };
  }, [quiz]);

  return (
    <EditorContext.Provider
      value={{
        quiz,
        setQuiz,
        updateQuiz,
        saving,
        saveQuiz,
        createQuiz,
        creating,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

const useEditor = (): MyContextData => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error(
      "useMyContext debe ser utilizado dentro de un MyContextProvider"
    );
  }
  return context;
};

export { EditorProvider, useEditor };
