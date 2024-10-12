"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconDeviceFloppy,
  IconLoader2,
  IconMoonFilled,
  IconSparkles,
} from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import UserMenu from "../UserMenu";
import Generator from "./Generator";
import { useEditor } from "@/context/EditorContext";
import { Quiz } from "@/lib/types/editorTypes";
import ShareButton from "./ShareButton";

interface Props {
  quiz: Quiz;
}

export default function Topbar({ quiz }: Props) {
  const {
    saving,
    updateQuiz,
    saveQuiz,
    quiz: quizLocal,
    generateQuestions,
  } = useEditor();
  return (
    <div className="fixed top-0 w-full bg-background h-[7vh] py-4 px-8 flex items-center justify-between gap-4 border-b z-30">
      <div className="flex items-center gap-2 w-fit">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={"ghost"} asChild>
                <Link href="/dashboard">
                  <IconMoonFilled size={32} className="text-primary" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Inicio</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Input
          placeholder="Cuestionario sin nombre"
          value={quizLocal?.name || ""}
          onChange={(e) => {
            updateQuiz("name", e.target.value);
          }}
          className="text-2xl font-bold border-0 focus:border-2"
          onClick={(e) => e.currentTarget.select()}
        />
      </div>

      <div className="flex items-center gap-2">
        <Generator />
        <Button
          variant={"ghost"}
          size={"icon"}
          disabled={saving}
          onClick={saveQuiz}
        >
          {saving ? (
            <IconLoader2 className="animate-spin" size={24} />
          ) : (
            <IconDeviceFloppy size={24} />
          )}
        </Button>
        <ShareButton quiz={quiz} />
        <UserMenu />
      </div>
    </div>
  );
}
