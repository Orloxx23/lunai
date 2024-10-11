"use client";

import React, { useState } from "react";
import { Quiz } from "@/lib/types/editorTypes";
import { DateTime } from "luxon";
import { IconLoader2, IconMoon, IconMoonFilled } from "@tabler/icons-react";
import { useRouter } from "next-nprogress-bar";

interface Props {
  quiz: Quiz;
}

export default function QuizCard({ quiz }: Props) {
  let router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    router.push(`/dashboard/editor/${quiz.id}`);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <button
      disabled={loading}
      onClick={handleClick}
      className="relative border border-border aspect-[9/10.5] flex flex-col rounded-md overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-2 hover:border-primary transition duration-300 ease-in-out hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
    >
      <div
        className={`absolute size-full flex justify-center items-center pointer-events-none transition-opacity duration-300 ease-in-out ${loading ? "opacity-100" : "opacity-0"}`}
      >
        <IconLoader2 className="animate-spin text-primary" />
      </div>
      <div className="h-2/3 bg-primary-foreground flex justify-center items-center w-full">
        <IconMoonFilled size={72} className="text-primary opacity-10" />
      </div>
      <div className="p-4 h-1/3 bg-background w-full border-t border-border flex flex-col justify-start items-start">
        <h1 className="text-sm font-bold">{quiz?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {DateTime.fromISO(quiz?.createdAt || "").toFormat("LLL dd, yyyy")}
        </p>
      </div>
    </button>
  );
}
