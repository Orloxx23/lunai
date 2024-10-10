"use client";

import useDebounced from "@/hooks/use-debounced";
import { APP_NAME } from "@/lib/constants/general";
import { generateProjectName, generateUUID } from "@/lib/functions/editor";
import { Option, Question, Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

type MyContextData = {
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz) => void;
  updateQuiz: (key: keyof Quiz, value: any) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  saveQuiz: () => void;
  createQuiz: () => void;
  creating: boolean;
  questions: Question[];
  createQuestion: () => void;
  deleteQuestion: (questionId: string) => void;
  updateQuestion: (questionId: string, key: keyof Question, value: any) => void;
};

const EditorContext = createContext<MyContextData | undefined>(undefined);

const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  let router = useRouter();
  let pathname = usePathname();

  const [quiz, setQuiz] = useState<Quiz | null>({
    id: "",
    name: "",
    title: "",
    description: "",
    questions: [],
  });
  const [questions, setQuestions] = useState<Question[]>([]);

  const [saving, setSaving] = useState(false);
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
      .insert([{ name }])
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
    if (!quiz?.id) return; // No guardes si no hay ID

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
      return;
    }

    if (data) {
      console.log("Quiz saved", data);
    }

    setSaving(false);
  };

  const getQuestions = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quizId", quiz?.id);

    if (error) {
      console.error("Error getting questions", error);
    }

    if (data) {
      setQuestions(data);
    }
  };

  const createQuestion = async () => {
    const newQuestion: Question = {
      id: generateUUID(),
      title: "",
      type: "multiple",
      description: "",
      quizId: quiz?.id || "",
    };

    setQuestions((prev) => [...prev, newQuestion]);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .insert([newQuestion])
      .select();

    if (error) {
      console.error("Error creating question", error);
      setQuestions((prev) => prev.filter((q) => q.id !== newQuestion.id));
    }

    if (data) {
      console.log("Question created", data);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    const questionToDelete: Question | null | undefined = questions.find(
      (q) => q.id === questionId
    );

    // Filtra la pregunta a eliminar
    const tempQuestions = questions.filter((q) => q.id !== questionId);
    setQuestions(tempQuestions);

    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .select();

    if (error) {
      console.error("Error deleting question", error);
      getQuestions();
    }

    if (data) {
      console.log("Question deleted", data);
    }

    setSaving(false);
  };

  const updateQuestion = async (
    questionId: string,
    key: keyof Question,
    value: any
  ) => {
    const questionToUpdate: Question | null | undefined = questions.find(
      (q) => q.id === questionId
    );

    if (!questionToUpdate) return;

    const newQuestions = questions.map((q) =>
      q.id === questionId
        ? {
            ...q,
            [key]: value,
          }
        : q
    );

    setQuestions(newQuestions);
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .update({ [key]: value })
      .eq("id", questionId)
      .select();

    if (error) {
      console.error("Error updating question", error);
      getQuestions();
    }

    if (data) {
      console.log("Question updated", data);
    }

    setSaving(false);
  };

  useEffect(() => {
    if (!quiz || !quiz.id) return;
    getQuestions();
  }, [quiz]);

  useEffect(() => {
    if (!quiz) return;

    const saveIfChanged = async () => {
      console.log("Saving if changed", quiz, debouncedQuiz);
      if (!quiz || !debouncedQuiz || quiz.id !== debouncedQuiz.id) return;

      await saveQuiz();
    };

    document.title = `${quiz?.name || "Cuestionario sin nombre"} - ${APP_NAME}`;

    saveIfChanged();
  }, [debouncedQuiz]);

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
        questions,
        createQuestion,
        deleteQuestion,
        updateQuestion,
        setSaving
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
