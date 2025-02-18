import React, { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconSettings } from "@tabler/icons-react";
import { useEditor } from "@/context/EditorContext";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function Config() {
  const { quiz, getQuiz } = useEditor();
  const supabase = createClient();

  const [loading, setLoading] = React.useState<boolean>(false);
  const [maxScore, setMaxScore] = React.useState<number>(0);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const saveConfig = async () => {
    setLoading(true);

    const { error: maxScoreError } = await supabase
      .from("quizzes")
      .update({ maxScore })
      .eq("id", quiz?.id);

    if (maxScoreError) {
      toast.error("No se pudo guardar la configuración");
      setLoading(false);
      return;
    }

    getQuiz(quiz?.id || "");
    toast.success("Configuración guardada");
    setLoading(false);
    setIsOpen(false);
  };

  useEffect(() => {
    if (quiz) {
      setMaxScore(quiz.maxScore);
    }
  }, [quiz]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size={"icon"}>
          <IconSettings size={24} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Configuración</AlertDialogTitle>
          <AlertDialogDescription className="hidden">
            Ajusta la configuración de tu quiz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap2">
          <div className="flex items-center justify-between">
            <p className="w-full">Calificación maxima</p>
            <Input
              type="number"
              className="w-20"
              step={0.5}
              min={0}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              saveConfig();
            }}
          >
            {loading ? <IconLoader2 className="animate-spin" /> : "Guardar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
