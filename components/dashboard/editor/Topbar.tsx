"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditor } from "@/context/EditorContext";
import {
  IconDeviceFloppy,
  IconEye,
  IconLoader2,
  IconMoonFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import UserMenu from "../UserMenu";
import Generator from "./Generator";
import ShareButton from "./ShareButton";
import StateButton from "./StateButton";
import { useEffect, useState } from "react";
import { Quiz } from "@/lib/types/editorTypes";

export default function Topbar({ quiz }: { quiz: Quiz }) {
  const {
    saving,
    updateQuiz,
    saveQuiz,
    quiz: quizLocal,
    generateQuestions,
  } = useEditor();

  const [state, setState] = useState(quiz?.state);
  const [generatorOpen, setGeneratorOpen] = useState(false);

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
          value={quizLocal?.name || quiz?.name}
          onChange={(e) => {
            updateQuiz("name", e.target.value);
          }}
          className="text-2xl font-bold border-0 focus:border-2"
          onClick={(e) => e.currentTarget.select()}
        />
      </div>

      <div className="flex items-center gap-2">
        <Generator isOpen={generatorOpen} setIsOpen={setGeneratorOpen} />
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={() => {
            window.open(`/reply/${quiz?.id}`, "_blank");
          }}
        >
          <IconEye size={24} />
        </Button>
        <StateButton state={state} setState={setState} />
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
        <ShareButton />
        <UserMenu />
      </div>
    </div>
  );
}
