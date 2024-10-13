"use client";

import { Option, Question, Quiz } from "@/lib/types/editorTypes";
import React, { createContext, useContext, useState } from "react";

type ReplyContextData = {};

const ReplyContext = createContext<ReplyContextData | undefined>(undefined);

const ReplyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  

  return (
    <ReplyContext.Provider
      value={{
        quiz,
        questions,
      }}
    >
      {children}
    </ReplyContext.Provider>
  );
};

const useReply = (): ReplyContextData => {
  const context = useContext(ReplyContext);

  if (!context) {
    throw new Error(
      "useMyContext debe ser utilizado dentro de un MyContextProvider"
    );
  }

  return context;
};

export { ReplyProvider, useReply };
