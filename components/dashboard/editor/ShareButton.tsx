import React from "react";
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

interface Props {
    quiz: Quiz;
}

export default function ShareButton(
    { quiz }: Props
) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>
            Enviar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Compartir cuestionario
          </AlertDialogTitle>
          <AlertDialogDescription>
            Comparte este enlace para que puedan responder a tu cuestionario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="">
            <Input
                readOnly
                type="text"
                className="w-full bg-background border border-gray-300 rounded p-2"
                value={`${window.location.origin}/reply/${quiz.id}`}
                onClick={(e) => {
                    e.currentTarget.select()
                    navigator.clipboard.writeText(
                        `${window.location.origin}/reply/${quiz.id}`
                    ).then(() => {
                        console.log("Copied to clipboard");
                    });
                }}
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
