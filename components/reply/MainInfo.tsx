"use client";

import { Question, Quiz } from "@/lib/types/editorTypes";
import React from "react";
interface Props {
  quiz: Quiz;
}

export default function MainInfo({ quiz }: Props) {
  if(quiz.name && quiz.description){
    return (
      <div
        className={`w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300 `}
      >
        <h1 className="text-2xl font-bold border-0 focus:border-2">
          {quiz?.title}
        </h1>
  
        <p className="text-sm border-0 focus:border-2 resize-none">
          {quiz?.description}
        </p>
      </div>
    );
  } else {
    return (<></>)
  }
}
