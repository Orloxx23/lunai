"use client";

import { useEditor } from "@/context/EditorContext";
import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";

export default function Responses({ view }: { view: string }) {
  const { quiz } = useEditor();
  const [responses, setResponses] = useState<any[]>([]);

  const getResponses = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("quiz_responses")
      .select("*")
      .eq("quizId", quiz?.id);

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setResponses(data);
    }
  };

  useEffect(() => {
    if (quiz) {
      getResponses();
    }
  }, [quiz]);

  return (
    <div
      className={`flex flex-col gap-4 bg-background border border-border p-4 rounded-md ${view !== "responses" && "hidden"}`}
    >
      <div className="flex items-center">
        <span className="text-xl">
          <strong>{responses.length}</strong>{" "}
          {responses.length === 1 ? "Respuesta" : "Respuestas"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {responses
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map((response) => (
            <button
              key={response.id}
              className="p-2 bg-accent rounded-sm flex justify-between items-center"
            >
              <div>{response.email}</div>
              <div>{response.score} puntos</div>
            </button>
          ))}
      </div>
    </div>
  );
}
