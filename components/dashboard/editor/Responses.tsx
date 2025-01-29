"use client";

import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next-nprogress-bar";
import React, { useEffect, useState } from "react";
import Summary from "./Summary";

export default function Responses({
  view,
  responses,
}: {
  view: string;
  responses: any[];
}) {
  const { quiz } = useEditor();

  let router = useRouter();

  const [tab, setTab] = useState<"summary" | "responses">("summary");

  const goToResponse = (responseId: string) => {
    router.push(`/dashboard/editor/${quiz?.id}/review/${responseId}`);
  };

  return view == "responses" ? (
    <>
      <div
        className={`flex flex-col gap-4 bg-background border border-border p-4 rounded-md`}
      >
        <div className="flex items-center">
          <span className="text-xl">
            <strong>{responses.length}</strong>{" "}
            {responses.length === 1 ? "Respuesta" : "Respuestas"}
          </span>
        </div>

        <div className="w-full bg-accent flex relative rounded-md overflow-hidden">
          <Button
            variant={"ghost"}
            className="rounded-none relative group w-full"
            onClick={() => setTab("summary")}
          >
            Resumen
          </Button>
          <Button
            variant={"ghost"}
            className="rounded-none relative group w-full"
            onClick={() => setTab("responses")}
          >
            Respuestas
          </Button>
          <div
            className={`absolute bottom-0 h-1 bg-primary transition-all duration-300 ease-in-out ${
              tab === "summary" ? "left-0 w-1/2" : "left-1/2 w-1/2"
            }`}
          ></div>
        </div>

        {tab === "responses" && (
          <div className="flex flex-col gap-2">
            {responses
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((response) => (
                <button
                  key={response.id}
                  onClick={() => goToResponse(response.id)}
                  className="p-2 bg-accent rounded-sm flex justify-between items-center"
                >
                  <div>{response.email}</div>
                  <div>{response.score} puntos</div>
                </button>
              ))}
          </div>
        )}
      </div>

      {tab === "summary" && <Summary updates={responses} />}
    </>
  ) : (
    <></>
  );
}
