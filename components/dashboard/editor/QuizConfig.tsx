"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useEditor } from "@/context/EditorContext";
import useDebounced from "@/hooks/use-debounced";
import { createClient } from "@/utils/supabase/client";
import React, { useEffect } from "react";
import { toast } from "sonner";

export default function QuizConfig() {
  const {
    quiz,
    autoScoring,
    toggleAutoScoring,
    getQuiz,
    setSaving,
    maxScore,
    setMaxScore,
    loading,
  } = useEditor();

  const supabase = createClient();

  const debouncedScore = useDebounced(maxScore, 700);

  const saveConfig = async () => {
    if (!quiz) return;
    setSaving(true);

    const { error: maxScoreError } = await supabase
      .from("quizzes")
      .update({ maxScore })
      .eq("id", quiz?.id);

    if (maxScoreError) {
      // toast.error("No se pudo guardar la configuración");
      setSaving(false);
      return;
    }

    getQuiz(quiz?.id || "");
    setSaving(false);
  };

  useEffect(() => {
    if (quiz) {
      setMaxScore(quiz.maxScore);
    }
  }, [quiz]);

  useEffect(() => {
    if (debouncedScore !== quiz?.maxScore && quiz) {
      saveConfig();
    }
  }, [quiz, debouncedScore]);

  return (
    <div className="border p-4 bg-background rounded-md flex flex-col gap-2">
      <p className="text-lg font-bold">Ajustes</p>
      <div className="flex border p-2 rounded-sm gap-2 justify-between items-center">
        <div className="flex flex-col justify-start">
          <p className="text-sm font-semibold">Puntaje maximo</p>
          <p className="text-sm text-foreground/70">
            El puntaje maximo que se puede obtener en el quiz
          </p>
        </div>
        {loading ? (
          <div className="w-20 h-10 bg-muted animate-pulse rounded-sm"></div>
        ) : (
          <Input
            type="number"
            className="w-20"
            step={0.5}
            min={0}
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
          />
        )}
      </div>

      <div className="flex border p-2 rounded-sm gap-2 justify-between items-center">
        <div className="flex flex-col justify-start">
          <p className="text-sm font-semibold">Puntajes automaticos</p>
          <p className="text-sm text-foreground/70">
            Hacer que todas las preguntas tengan el mismo puntaje
          </p>
        </div>
        <Switch checked={autoScoring} onCheckedChange={toggleAutoScoring} />
      </div>
    </div>
  );
}
