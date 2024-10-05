"use client";

import useDebounced from "@/hooks/use-debounced";
import { Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import React, { createContext, useContext, useEffect, useState } from "react";

type MyContextData = {
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz) => void;
  updateQuiz: (key: keyof Quiz, value: any) => void;
  saving: boolean;
  saveQuiz: () => void;
};

const EditorContext = createContext<MyContextData | undefined>(undefined);

const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [quiz, setQuiz] = useState<Quiz | null>({
    id: "",
    name: "",
    title: "",
    description: "",
    questions: [],
  });

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

  const createQuiz = async () => {
    const supabase = createClient();

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
    }
  };

  const saveQuiz = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  function generateProjectName(): string {
    const adjectives = [
      "Brilliant",
      "Silent",
      "Cosmic",
      "Swift",
      "Quantum",
      "Lunar",
      "Bright",
      "Sonic",
      "Nova",
      "Electric",
    ];

    const nouns = [
      "Phoenix",
      "Wave",
      "Falcon",
      "Engine",
      "Orbit",
      "Horizon",
      "Pulse",
      "Drift",
      "Echo",
      "Fusion",
    ];

    const randomNumber = Math.floor(Math.random() * 1000);

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    const projectName = `${randomAdjective}${randomNoun}${randomNumber}`;

    return projectName;
  }

  useEffect(() => {
    console.log(debouncedQuiz);
    saveQuiz();
  }, [debouncedQuiz]);

  useEffect(() => {
    if (quiz?.id === "") {
      createQuiz();
    }
  }, []);

  return (
    <EditorContext.Provider
      value={{ quiz, setQuiz, updateQuiz, saving, saveQuiz }}
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
