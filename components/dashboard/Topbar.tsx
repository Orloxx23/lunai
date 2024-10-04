"use client";

import React, { useEffect } from "react";
import UserMenu from "./UserMenu";
import { CommandDialogSearch } from "./command-dialog";
import { Button } from "../ui/button";
import { IconMenu2 } from "@tabler/icons-react";
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

export default function Topbar() {
  let pathname = usePathname();

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="h-[10vh] py-4 px-8 flex items-center gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button size={"icon"} variant={"outline"} className="flex 2xl:hidden">
            <IconMenu2 size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side={"left"}
          className="bg-primary border-0 text-primary-foreground"
        >
          <SheetHeader className="hidden">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Selecciona una opción</SheetDescription>
          </SheetHeader>
          <div className="w-full flex flex-col">
            <span className="text-3xl">Lunai</span>
            <Separator className="my-4" />
            {sidebarItems.map((item, index) => (
              <Link
                key={index}
                href={item.href ?? ""}
                className={`flex items-center gap-4 py-4 px-4 hover:bg-white/10  text-lg transition-colors duration-300 rounded-md ${
                  pathname === item.href
                    ? "bg-white text-primary hover:bg-white"
                    : "text-primary-foreground"
                }`}
              >
                <span className="">{item.icon}</span>
                <span className="lg:hidden 2xl:block">{item.title}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <CommandDialogSearch />

      <div className="flex-1"></div>
      
      <div className="flex items-center gap-4">
        <button className="relative border hover:border-indigo-600 duration-500 group cursor-pointer text-indigo-50  overflow-hidden h-11 w-40 rounded-md bg-indigo-800 p-2 flex justify-center items-center font-extrabold">
          <div className="absolute z-10 w-48 h-48 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-900 delay-150 group-hover:delay-75"></div>
          <div className="absolute z-10 w-40 h-40 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-800 delay-150 group-hover:delay-100"></div>
          <div className="absolute z-10 w-32 h-32 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-700 delay-150 group-hover:delay-150"></div>
          <div className="absolute z-10 w-24 h-24 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-600 delay-150 group-hover:delay-200"></div>
          <div className="absolute z-10 w-16 h-16 rounded-full group-hover:scale-150 transition-all  duration-500 ease-in-out bg-indigo-500 delay-150 group-hover:delay-300"></div>
          <p className="z-10">Crear</p>
        </button>

        <UserMenu />
      </div>
    </div>
  );
}
