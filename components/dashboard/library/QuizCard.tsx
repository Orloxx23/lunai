"use client";

import React, { useState, useEffect } from "react";
import { Quiz, Folder } from "@/lib/types/editorTypes";
import { DateTime } from "luxon";
import {
  IconDotsVertical,
  IconLoader2,
  IconMoonFilled,
} from "@tabler/icons-react";
import { useRouter } from "next-nprogress-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface Props {
  quiz: Quiz;
  callback?: () => void;
}

export default function QuizCard({ quiz, callback }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);

  const supabase = createClient();

  const handleClick = () => {
    setLoading(true);
    router.push(`/dashboard/editor/${quiz.id}`);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const getFolders = async () => {
    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;

    const { data: folders, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching folders", error);
      toast.error("Error al cargar las carpetas");
      return [];
    }

    return folders || [];
  };

  const deleteQuiz = async () => {
    setDeleting(true);

    const { error } = await supabase.from("quizzes").delete().eq("id", quiz.id);

    if (error) {
      console.error("Error deleting quiz", error);
      toast.error("Error al eliminar el quiz");
    } else {
      toast.success("Quiz eliminado correctamente");
      callback && callback();
    }

    setTimeout(() => {
      setDeleting(false);
    }, 2000);
  };

  const moveQuizToFolder = async () => {
    if (selectedFolderId === "null") {
      // Mover a la carpeta raíz (remover folderId)
      const { error } = await supabase
        .from("quizzes")
        .update({ folderId: null })
        .eq("id", quiz.id);

      if (error) {
        console.error("Error moving quiz to root", error);
        toast.error("Error al mover el cuestionario a la raíz");
      } else {
        toast.success("Cuestionario movido a la raíz correctamente");
        setIsMoveModalOpen(false);
        setSelectedFolderId(null);
        callback && callback();
      }
    } else {
      // Mover a una carpeta seleccionada
      const { error } = await supabase
        .from("quizzes")
        .update({ folderId: selectedFolderId })
        .eq("id", quiz.id);

      if (error) {
        console.error("Error moving quiz", error);
        toast.error("Error al mover el cuestionario");
      } else {
        toast.success("Cuestionario movido correctamente");
        setIsMoveModalOpen(false);
        setSelectedFolderId(null);
        callback && callback();
      }
    }
  };

  useEffect(() => {
    const loadFolders = async () => {
      const folders = await getFolders();
      setFolders(folders);
      // Si el quiz tiene un folderId, marcarlo como seleccionado
      setSelectedFolderId(quiz.folderId || null);
    };

    loadFolders();
  }, [quiz]);

  return (
    <>
      <button
        disabled={loading}
        onClick={handleClick}
        className="w-full relative border border-border h-72 flex flex-col rounded-md overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-2 hover:border-primary transition duration-300 ease-in-out hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
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
            <h1 className="text-sm font-bold truncate">{quiz?.name}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {DateTime.fromISO(quiz?.createdAt || "").toFormat("LLL dd, yyyy")}
            </p>
          </div>
          <div className="">
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
                    deleteQuiz();
                  }}
                >
                  Eliminar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoveModalOpen(true);
                  }}
                >
                  Mover a carpeta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </button>

      {/* Modal para mover el cuestionario */}
      <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover cuestionario</DialogTitle>
            <DialogDescription>
              Selecciona la carpeta a la que deseas mover este cuestionario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup
              value={selectedFolderId || ""}
              onValueChange={(value) => setSelectedFolderId(value)}
            >
              {/* Opción para mover a la raíz */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="null"
                  id="root-folder"
                  checked={selectedFolderId === "null"}
                  onChange={() => setSelectedFolderId(null)}
                />
                <Label htmlFor="root-folder">Inicio</Label>
              </div>
              {/* Opciones para mover a carpetas específicas */}

              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={folder.id} id={folder.id} />
                  <Label htmlFor={folder.id}>{folder.folder_name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button onClick={moveQuizToFolder}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
