"use client";

import { Folder } from "@/lib/types/editorTypes";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface FolderCardProps {
  folder: Folder;
  onDelete: (folderId: string) => void;
  handleClick: () => void;
}

export default function FolderCard({
  folder,
  onDelete,
  handleClick,
}: FolderCardProps) {
  const supabase = createClient();

  const [deleting, setDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [folderNameText, setFolderNameText] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Si el texto de confirmación es incorrecto, no procedemos
    if (
      folderNameText !== folder.folder_name ||
      confirmationText !== "confirmar"
    ) {
      toast.error(
        "Confirmación incorrecta. Asegúrate de escribir el nombre de la carpeta y 'confirmar'."
      );
      return;
    }

    setDeleting(true);

    try {
      // Primero obtenemos todos los quizzes asociados con esta carpeta
      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("id")
        .eq("folderId", folder.id);

      if (quizzesError) throw new Error(quizzesError.message);

      // Eliminamos todos los quizzes relacionados
      if (quizzes?.length) {
        const { error: deleteQuizzesError } = await supabase
          .from("quizzes")
          .delete()
          .in(
            "id",
            quizzes.map((quiz) => quiz.id)
          );

        if (deleteQuizzesError) throw new Error(deleteQuizzesError.message);
      }

      // Ahora obtenemos todas las subcarpetas asociadas a esta carpeta
      const { data: subfolders, error: subfoldersError } = await supabase
        .from("folders")
        .select("id")
        .eq("parent_id", folder.id); // Asumiendo que existe un campo `parentFolderId` en las subcarpetas

      if (subfoldersError) throw new Error(subfoldersError.message);

      // Eliminamos todas las subcarpetas
      if (subfolders?.length) {
        const { error: deleteSubfoldersError } = await supabase
          .from("folders")
          .delete()
          .in(
            "id",
            subfolders.map((subfolder) => subfolder.id)
          );

        if (deleteSubfoldersError)
          throw new Error(deleteSubfoldersError.message);
      }

      // Finalmente, eliminamos la carpeta principal
      const { error: deleteFolderError } = await supabase
        .from("folders")
        .delete()
        .eq("id", folder.id);

      if (deleteFolderError) throw new Error(deleteFolderError.message);

      onDelete(folder.id); // Llamamos a la función para actualizar el estado

      toast.success("Carpeta eliminada exitosamente");
    } catch (error) {
      toast.error("Error al eliminar la carpeta y sus contenidos");
      console.error("Error deleting folder and its contents", error);
    }

    setDeleting(false);
    setShowConfirmModal(false); // Cerrar el modal después de eliminar
  };

  return (
    <>
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogTrigger asChild></AlertDialogTrigger>

        {/* Dialog de confirmación */}
        <AlertDialogContent>
          <AlertDialogTitle>¡Advertencia!</AlertDialogTitle>
          <AlertDialogDescription>
            Al eliminar esta carpeta, también se eliminarán todas sus
            subcarpetas y quizzes. Esta acción no se puede deshacer. Por favor,
            confirme que desea eliminar la carpeta.
          </AlertDialogDescription>
          <Input
            type="text"
            placeholder={`Escribe '${folder.folder_name}'`}
            value={folderNameText}
            onChange={(e) => setFolderNameText(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Escribe 'confirmar'"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
          />
          <AlertDialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)} // Cerrar modal
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete} // Ejecutar la eliminación
              disabled={
                deleting ||
                folderNameText !== folder.folder_name ||
                confirmationText !== "confirmar"
              }
            >
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button
        onClick={handleClick}
        className="relative w-full h-72 flex flex-col items-center p-4 justify-center bg-primary-foreground border rounded-lg cursor-pointer hover:border-4 hover:border-primary overflow-hidden group transition-all duration-300 ease-[0,445, 0,05, 0,55, 0,95]"
      >
        {/* Botón de eliminar */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirmModal(true);
          }}
        >
          <IconTrash size={20} className="text-red-600" />
        </Button>

        {/* Nombre de la carpeta */}
        <p className="mt-2 text-pretty text-lg font-medium text-gray-700 group-hover:scale-105 transition-all duration-300 ease-[0,445, 0,05, 0,55, 0,95]">
          {folder.folder_name}
        </p>

        {/* Línea decorativa */}
        <div className="absolute top-0 w-full h-1 bg-primary group-hover:opacity-0"></div>
      </button>
    </>
  );
}
