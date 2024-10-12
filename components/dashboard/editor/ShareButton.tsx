import React, { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Quiz } from "@/lib/types/editorTypes";
import { copyToClipboard } from "@/lib/functions/general";
import {
  IconFile,
  IconKey,
  IconLock,
  IconLockOpen,
  IconLockOpen2,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Props {
  quiz: Quiz;
}

export default function ShareButton({ quiz }: Props) {
  const [quizLink, setQuizLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQuizLink(`${window.location.origin}/reply/${quiz.id}`);
    }
  }, [quiz.id]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Enviar</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Compartir cuestionario</AlertDialogTitle>
          <AlertDialogDescription>
            Comparte este enlace para que puedan responder a tu cuestionario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 items-start justify-start p-2 bg-muted rounded-lg">
            <div className="">
              {quiz.state === "privateWithLink" && (
                <IconKey size={24} className="text-primary" />
              )}
              {quiz.state === "private" && (
                <IconLock size={24} className="text-primary" />
              )}
              {quiz.state === "public" && (
                <IconLockOpen size={24} className="text-primary" />
              )}
            </div>

            <p className="text-sm">
              {quiz.state === "privateWithLink" &&
                "Tu cuestionario es privado, solo pueden responderlo las personas con el enlace."}
              {quiz.state === "private" &&
                "Tu cuestionario esta en privado. Cambialo a público o privado con enlace para que puedan acceder a el."}
              {quiz.state === "public" &&
                "Tu cuestionario es público, cualquiera podrá verlo o copiarlo."}
            </p>
          </div>
          <Input
            readOnly
            type="text"
            className="w-full bg-background border border-gray-300 rounded p-2 cursor-pointer"
            value={quizLink}
            onClick={(e) => {
              e.currentTarget.select();
              navigator.clipboard.writeText(quizLink).then(() => {
                toast.info("Enlace copiado al portapapeles");
              });
            }}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              copyToClipboard(quizLink, () => {
                toast.info("Enlace copiado al portapapeles");
              });
            }}
          >
            Copiar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
