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
  IconMenu,
  IconMenu2,
  IconMoonFilled,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";
import UserMenu from "../UserMenu";
import Generator from "./Generator";
import ShareButton from "./ShareButton";
import StateButton from "./StateButton";
import { useEffect, useState } from "react";
import { Quiz } from "@/lib/types/editorTypes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants/general";
import { useRouter } from "next-nprogress-bar";

export default function Topbar({ quiz }: { quiz: Quiz }) {
  const {
    saving,
    updateQuiz,
    saveQuiz,
    quiz: quizLocal,
  } = useEditor();
  const router = useRouter();

  const [state, setState] = useState(quiz?.state);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
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

        <div className="items-center gap-2 hidden md:flex">
          <Generator isOpen={generatorOpen} setIsOpen={setGeneratorOpen} />
          <Button
            size={"icon"}
            variant={"ghost"}
            onClick={() => {
              router.push(`/reply/${quiz?.id}`);
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

        <Button
          className="flex md:hidden"
          size={"icon"}
          variant={"outline"}
          onClick={() => {
            setSheetOpen(true);
          }}
        >
          <IconMenu2 size={24} />
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader className="hidden">
            <SheetTitle>Menu de cuestionario</SheetTitle>
            <SheetDescription>
              Acciones rápidas para el cuestionario
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col mt-4 gap-1 h-full">
            <Button
              variant={"ghost"}
              className="w-full flex items-center justify-start gap-2"
              onClick={() => {
                setSheetOpen(false);
                router.push(`/reply/${quiz?.id}`);
              }}
            >
              <IconEye size={16} /> Ver cuestionario
            </Button>
            <Button
              variant={"ghost"}
              className="w-full flex items-center justify-start gap-2"
              onClick={() => {
                setSheetOpen(false);
                setGeneratorOpen(true);
              }}
            >
              <IconSparkles size={16} /> Generar preguntas
            </Button>
            <Button
              variant={"ghost"}
              className="w-full flex items-center justify-start gap-2"
              disabled={saving}
              onClick={() => {
                // setSheetOpen(false);
                saveQuiz();
              }}
            >
              <IconDeviceFloppy size={16} />
              {saving ? "Guardando..." : "Guardar cuestionario"}
            </Button>
            <div className="w-full flex items-center justify-between gap-2 px-4">
              <div className="select-none">Visiblidad:</div>
              <StateButton state={state} setState={setState} />
            </div>

            <ShareButton />
            <div className="flex-1"></div>
            <div className="flex items-center justify-between">
              {APP_NAME}
              <UserMenu />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
