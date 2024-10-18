"use client";

import React, { useState } from "react";
import { Quiz } from "@/lib/types/editorTypes";
import { DateTime } from "luxon";
import {
  IconDots,
  IconDotsVertical,
  IconLoader2,
  IconMoon,
  IconMoonFilled,
} from "@tabler/icons-react";
import { useRouter } from "next-nprogress-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface Props {
  quiz: Quiz;
  response: any;
}

export default function ReponseCard({ response, quiz }: Props) {
  let router = useRouter();
  const [loading, setLoading] = useState(false);

  const _response = response.response;
  console.log("🚀 ~ ReponseCard ~ _response:", _response)

  const handleClick = () => {
    setLoading(true);
    router.push(`/dashboard/review/${_response.id}`);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <button
      disabled={loading}
      onClick={handleClick}
      className="min-w-52 w-52 relative border border-border h-64 flex flex-col rounded-md overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-2 hover:border-primary transition duration-300 ease-in-out hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
    >
      <div
        className={`absolute size-full flex justify-center items-center pointer-events-none transition-opacity duration-300 ease-in-out ${loading ? "opacity-100" : "opacity-0"}`}
      >
        <IconLoader2 className="animate-spin text-primary" />
      </div>
      <div className="h-2/3 bg-primary-foreground flex justify-center items-center w-full">
        <IconMoonFilled size={72} className="text-primary opacity-10" />
      </div>
      <div className="p-4 h-1/3 bg-background w-full border-t border-border flex justify-between items-center gap-2">
        <div className="flex flex-col items-start justify-start truncate">
          <h1 className="text-sm font-bold truncate">{_response.quizzes.name}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {DateTime.fromISO(_response.createdAt || "").toFormat("LLL dd, yyyy")}
          </p>
        </div>
        {/* <div className="">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  
                }}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}
      </div>
    </button>
  );
}
