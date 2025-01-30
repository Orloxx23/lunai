"use client";

import React, { useEffect } from "react";
import UserMenu from "./UserMenu";
import { CommandDialogSearch } from "./command-dialog";
import { Button } from "../ui/button";
import { IconLoader2, IconMenu2 } from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sidebarItems } from "@/lib/constants/menus";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "../ui/separator";
import { APP_NAME } from "@/lib/constants/general";
import { useEditor } from "@/context/EditorContext";

export default function Topbar() {
  let pathname = usePathname();

  const { creating, createQuiz } = useEditor();

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="h-[10vh] py-4 px-8 flex items-center gap-4 justify-between">
      {/* Menú de navegación principal */}
      <div className="hidden md:flex gap-4 items-center">
        <Link
          href={"/dashboard"}
          className={`${pathname === "/dashboard" ? "text-primary font-bold" : "text-foreground/50 hover:text-primary/70"} `}
        >
          Cuestionarios
        </Link>
        <Link
          href={"/dashboard/responses"}
          className={`${pathname === "/dashboard/responses" ? "text-primary font-bold" : "text-foreground/50 hover:text-primary/70"} `}
        >
          Mis respuestas
        </Link>
      </div>

      {/* Menú hamburguesa en pantallas pequeñas */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="md:hidden">
          <IconMenu2 size={24} />
        </SheetTrigger>
        <SheetContent side={"left"}>
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <Link
              href={"/dashboard"}
              className={`${pathname === "/dashboard" ? "text-primary font-bold" : "text-foreground/50 hover:text-primary/70"} `}
            >
              Cuestionarios
            </Link>
            <Link
              href={"/dashboard/responses"}
              className={`${pathname === "/dashboard/responses" ? "text-primary font-bold" : "text-foreground/50 hover:text-primary/70"} `}
            >
              Mis respuestas
            </Link>
            <Separator />
            {/* Puedes agregar más enlaces aquí */}
          </div>
        </SheetContent>
      </Sheet>

      {/* Espaciador */}
      <div className="flex-1"></div>

      {/* Botón Crear y UserMenu */}
      <div className="flex items-center gap-4">
        <button
          onClick={createQuiz}
          disabled={creating}
          className="relative border hover:border-indigo-600 duration-500 group cursor-pointer text-indigo-50  overflow-hidden h-11 w-40 rounded-md bg-indigo-800 p-2 flex justify-center items-center font-extrabold disabled:opacity-45"
        >
          <div className="absolute z-10 w-48 h-48 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-900 delay-150 group-hover:delay-75"></div>
          <div className="absolute z-10 w-40 h-40 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-800 delay-150 group-hover:delay-100"></div>
          <div className="absolute z-10 w-32 h-32 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-700 delay-150 group-hover:delay-150"></div>
          <div className="absolute z-10 w-24 h-24 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-600 delay-150 group-hover:delay-200"></div>
          <div className="absolute z-10 w-16 h-16 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-500 delay-150 group-hover:delay-300"></div>
          <p className="z-10">
            {creating ? <IconLoader2 className="animate-spin" /> : "Crear"}
          </p>
        </button>

        <UserMenu />
      </div>
    </div>
  );
}
