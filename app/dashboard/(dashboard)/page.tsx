"use client";

import FolderCard from "@/components/dashboard/library/FolderCard";
import QuizCard from "@/components/dashboard/library/QuizCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEditor } from "@/context/EditorContext";
import { Quiz, Folder } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import {
  IconLoader2,
  IconPlus,
  IconFolderPlus,
  IconArrowLeft,
} from "@tabler/icons-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export default function LibraryPage() {
  const { createQuiz, creating } = useEditor();

  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const supabase = createClient();

  const getQuizzes = async (
    page: number,
    pageSize: number = 9,
    folderId: string | null = null
  ) => {
    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;

    let query = supabase
      .from("quizzes")
      .select("*")
      .eq("authorId", userId)
      .order("createdAt", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (folderId) {
      query = query.eq("folderId", folderId);
    } else {
      query = query.is("folderId", null);
    }

    const { data: quizzes, error } = await query;

    if (error) {
      console.error("Error fetching quizzes", error);
      return [];
    }

    return quizzes || [];
  };

  const getFolders = async (parentId: string | null = null) => {
    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;

    let query = supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (parentId) {
      query = query.eq("parent_id", parentId);
    } else {
      query = query.is("parent_id", null);
    }

    const { data: folders, error } = await query;

    if (error) {
      console.error("Error fetching folders", error);
      return [];
    }

    return folders || [];
  };

  const loadInitialData = async () => {
    setLoading(true);
    const initialQuizzes = await getQuizzes(page, 9, currentFolder);
    const initialFolders = await getFolders(currentFolder);
    setQuizzes(initialQuizzes);
    setFolders(initialFolders);
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, [currentFolder]);

  const loadMoreQuizzes = useCallback(async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    const nextPage = page + 1;
    const newQuizzes = await getQuizzes(nextPage, 9, currentFolder);

    if (newQuizzes.length === 0) {
      setHasMore(false);
    } else {
      setQuizzes((prevQuizzes) => [...prevQuizzes, ...newQuizzes]);
      setPage(nextPage);
    }

    setIsFetching(false);
  }, [isFetching, hasMore, page, currentFolder]);

  useEffect(() => {
    if (loading || !hasMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          loadMoreQuizzes();
        }
      },
      { threshold: 1.0 }
    );

    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, hasMore, isFetching, loadMoreQuizzes]);

  const navigateToFolder = (folderId: string) => {
    setCurrentFolder(folderId);
    setPage(1);
    setQuizzes([]);
    setFolders([]); // Limpiamos las carpetas mientras cargamos nuevas
    setLoading(true); // Activamos el loading mientras se cargan los datos

    loadInitialData().then(() => {
      setLoading(false); // Desactivamos el loading una vez cargadas las carpetas
    });
  };

  const goBack = async () => {
    if (currentFolder) {
      const { data: parentFolder } = await supabase
        .from("folders")
        .select("parent_id")
        .eq("id", currentFolder)
        .single();

      setCurrentFolder(parentFolder?.parent_id || null);
      setPage(1);
      setHasMore(true); // Reset "hasMore" when going back
      setQuizzes([]); // Clear quizzes only when going back
    }
  };

  const createFolder = async () => {
    if (!folderName) {
      toast.error("El nombre de la carpeta no puede estar vacío");
      return;
    }

    setCreatingFolder(true);

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;

    const { data: newFolder, error } = await supabase
      .from("folders")
      .insert([
        {
          folder_name: folderName,
          user_id: userId,
          parent_id: currentFolder,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating folder", error);
      toast.error("Error al crear la carpeta");
    } else {
      toast.success("Carpeta creada correctamente");
      setFolders((prevFolders) => [newFolder, ...prevFolders]);
      setIsDialogOpen(false);
      setFolderName("");
    }

    setCreatingFolder(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 py-4">
      {currentFolder && (
        <div
          className="w-full h-72 flex items-center justify-center bg-white rounded-lg cursor-pointer hover:bg-gray-200"
          onClick={goBack}
        >
          <IconArrowLeft size={32} />
        </div>
      )}

      <div className="flex flex-col h-72 rounded-lg overflow-hidden">
        <Button
          disabled={creating || loading}
          onClick={createQuiz}
          className="size-full rounded-none"
        >
          {creating ? (
            <IconLoader2 size={32} className="animate-spin" />
          ) : (
            <IconPlus size={32} />
          )}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={creatingFolder || loading}
              className="size-full rounded-none"
            >
              {creatingFolder ? (
                <IconLoader2 size={32} className="animate-spin" />
              ) : (
                <IconFolderPlus size={32} />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva carpeta</DialogTitle>
              <DialogDescription>
                Ingresa el nombre de la carpeta que deseas crear.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full"
                placeholder="Nombre de la carpeta"
              />
            </div>
            <DialogFooter>
              <Button onClick={createFolder} disabled={creatingFolder}>
                {creatingFolder ? (
                  <IconLoader2 size={20} className="animate-spin" />
                ) : (
                  "Crear carpeta"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="w-full h-72 bg-gray-200 animate-pulse" />
      ) : (
        folders.map((folder) => (
          <div
            key={folder.id}
            ref={
              folders.length - 1 === folders.indexOf(folder)
                ? lastElementRef
                : null
            }
          >
            <FolderCard
              folder={folder}
              handleClick={() => navigateToFolder(folder.id)}
              onDelete={() => {
                console.log("Deleting folder");
                setFolders(folders.filter((f) => f.id !== folder.id));
              }}
            />
          </div>
        ))
      )}

      {quizzes.map((quiz, index) => (
        <div
          key={quiz.id}
          ref={quizzes.length - 1 === index ? lastElementRef : null}
        >
          <QuizCard
            quiz={quiz}
            callback={() => {
              // Aunque se borre o se mueve el cuestionario, actualizamos la lista
              setQuizzes(quizzes.filter((q) => q.id !== quiz.id));
            }}
          />
        </div>
      ))}

      {loading &&
        Array.from({ length: 14 }).map((_, index) => (
          <div key={index} className="w-full h-72 bg-gray-200 animate-pulse" />
        ))}

      {isFetching && <div className="w-full h-64 bg-gray-200 animate-pulse" />}

      {!hasMore && <></>}
    </div>
  );
}
