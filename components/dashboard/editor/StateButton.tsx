import React, { useState } from "react";
import { Quiz } from "@/lib/types/editorTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconLock, IconLockOpen, IconLockPassword } from "@tabler/icons-react";
import { useEditor } from "@/context/EditorContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StateButton() {
  const { quiz, updateQuiz } = useEditor();
  const [state, setState] = useState(quiz?.state);
  const [hightlight, setHightlight] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={"icon"} variant={"ghost"}>
          {state === "public" && <IconLockOpen size={20} />}
          {state === "private" && <IconLock size={20} />}
          {state === "exclusive" && <IconLockPassword size={20} />}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado del cuestionario</DialogTitle>
          <DialogDescription
            className={`transition duration-300 ease-in-out ${hightlight && "text-primary"}`}
          >
            {state === "private" &&
              "El cuestionario está privado, solo tu puedes verlo."}

            {state === "public" &&
              "El cuestionario está público, cualquier persona puede verlo."}

            {state === "exclusive" && (
              <span>
                El cuestionario está con acceso exclusivo, solo las personas con
                el link acceder.
              </span>
            )}
          </DialogDescription>
          <div className="">
            <Select
              value={state}
              onValueChange={(value: any) => {
                updateQuiz("state", value);
                setState(value);
                setHightlight(true);
                setTimeout(() => {
                  setHightlight(false);
                }, 2000);
              }}
            >
              <SelectTrigger className="w-full mt-4">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="exclusive">Exclusivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
