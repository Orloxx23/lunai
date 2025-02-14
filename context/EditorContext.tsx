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
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  createQuestion: () => void;
  deleteQuestion: (questionId: string) => void;
  updateQuestion: (questionId: string, key: keyof Question, value: any) => void;
  generateQuestions: (
    amount: number,
    context: string,
    difficulty: string,
    callback?: (value?: any) => void
  ) => void;
  generatedOptions: Option[];
  generating: boolean;
};

const EditorContext = createContext<MyContextData | undefined>(undefined);

const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  let router = useRouter();
  let pathname = usePathname();

  const [quiz, setQuiz] = useState<Quiz>({
    id: "",
    name: "",
    title: "",
    description: "",
    isPublic: false,
    state: "private",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<Option[]>([]);
  const [generating, setGenerating] = useState(false);

  const [questionsGeted, setQuestionsGeted] = useState(false);

  const [saving, setSaving] = useState(false);
  const debouncedQuiz = useDebounced(quiz, 700);
  const updateQuiz = (key: keyof Quiz, value: any) => {
    setQuiz((prev) => {
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
      setQuiz((prev) => {
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
        state: debouncedQuiz?.state,
      })
      .eq("id", debouncedQuiz?.id)
      .select();

    if (error) {
      console.error("Error saving quiz", error);
      return;
    }

    if (data) {
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
      position: questions.length,
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
    }

    setSaving(false);
  };

  const generateQuestions = async (
    amount: number,
    context: string,
    difficulty: string,
    callback?: (value?: any) => void
  ) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: JSON.stringify({ amount, context, difficulty }),
      });

      const data = await res.json();

      const questionInserts = data.questions.map(async (question: any, index: number) => {
        const newQuestion: Question = {
          id: generateUUID(),
          title: question.title,
          type: question.type,
          description: question.description || "",
          quizId: quiz?.id || "",
          correctAnswer: question.correctAnswer || null,
          position: questions.length + index,
        };

        const supabase = createClient();
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .insert([newQuestion])
          .select();

        if (questionError) {
          console.error("Error creating question", questionError);
          return null; // Handle the question error by returning null
        }

        const optionsInserts = question.options.map(async (option: any) => {
          const newOption: Option = {
            id: generateUUID(),
            title: option.title,
            description: option.description || "",
            isCorrect: option.isCorrect,
            questionId: newQuestion.id,
          };

          const { data: optionData, error: optionError } = await supabase
            .from("options")
            .insert([newOption])
            .select();

          if (optionError) {
            console.error("Error creating option", optionError);
            return null; // Handle the option error
          }

          return newOption; // Return the newly created option
        });

        const options = await Promise.all(optionsInserts); // Wait for all options to be inserted
        setGeneratedOptions((prev) => [...prev, ...options.filter(Boolean)]); // Filter out nulls

        return newQuestion; // Return the newly created question
      });

      const _questions = await Promise.all(questionInserts); // Wait for all questions to be inserted
      setQuestions((prev) => [...prev, ..._questions.filter(Boolean)]); // Filter out nulls

      if (callback) callback();
    } catch (err) {
      console.error("Error generating questions", err);
    } finally {
      setGenerating(false); // Ensure setGenerating is called finally
    }
  };

  useEffect(() => {
    if (!quiz || !quiz.id || questionsGeted) return;

    getQuestions();
    setQuestionsGeted(true);

    return () => {
      // setQuestions([]);
      // setQuestionsGeted(false);
    };
  }, [quiz, questionsGeted]);

  useEffect(() => {
    if (!quiz) return;

    const saveIfChanged = async () => {
      if (!quiz || !debouncedQuiz || quiz.id !== debouncedQuiz.id) return;

      await saveQuiz();
    };

    if (pathname.includes("editor") && quiz.id) {
      document.title = `${quiz?.name || "Cuestionario sin nombre"} - ${APP_NAME}`;
    } else {
      document.title = `${APP_NAME}: El Poder del Conocimiento con Inteligencia Artificial`;
    }

    saveIfChanged();
  }, [debouncedQuiz]);

  useEffect(() => {
    setQuestionsGeted(false);
    setQuestions([]);
  }, [pathname]);

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
        setQuestions,
        createQuestion,
        deleteQuestion,
        updateQuestion,
        setSaving,
        generateQuestions,
        generatedOptions,
        generating,
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
