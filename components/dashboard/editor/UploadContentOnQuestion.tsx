"use client";

import { Button } from "@/components/ui/button";
import { Question } from "@/lib/types/editorTypes";
import { IconPhoto, IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import FileUploader from "@/components/file-uploader";
import { createClient } from "@/utils/supabase/client";
import { useEditor } from "@/context/EditorContext";
import * as tus from "tus-js-client";

export default function UploadContentOnQuestion({
  question,
  callback,
}: {
  question: Question;
  callback: () => void;
}) {
  const { quiz } = useEditor();
  const supabase = createClient();

  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File) => {
    const fileName = `${new Date().getTime()}`;
    const bucketName = "contents"; // Nombre del bucket en Supabase Storage
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${session?.access_token}`,
          "x-upsert": "true",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // Permite volver a subir el mismo archivo
        metadata: {
          bucketName: bucketName,
          objectName: `${quiz?.id}/${fileName}`,
          contentType: file.type,
          cacheControl: "3600",
        },
        chunkSize: 8 * 1024 * 1024, // Tamaño del chunk (8MB)
        onError: (error) => {
          console.error("Error uploading file:", error);
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          console.log("🚀 ~ returnnewPromise ~ percentage:", percentage);
          setUploadProgress(parseFloat(percentage)); // Actualiza el progreso
        },
        onSuccess: () => {
          console.log("File uploaded successfully:", upload.url);
          resolve(upload.url);
        },
      });

      // Busca cargas previas para reanudar
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start(); // Inicia la carga
      });
    });
  };

  const uploadImage = async (files: File[]) => {
    if (!files.length || !quiz?.id) return;
    try {
      const fileName = `${new Date().getTime()}`;
      const file = new File([files[0]], fileName, { type: files[0].type });
      await uploadFile(file);

      // Guarda la URL de la imagen en la base de datos
      await supabase.from("questions").upsert({
        id: question.id,
        image: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/contents/${quiz?.id}/${fileName}`,
      });

      setOpen(false);
      callback();
      setUploadProgress(0); // Reinicia el progreso
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <div className="">
          <Button size={"icon"} variant={"ghost"}>
            <IconPhoto />
          </Button>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-xl">
        <AlertDialogHeader>
          <div className="flex justify-between items-center">
            <AlertDialogTitle>Sube contenido a la pregunta</AlertDialogTitle>
            <button onClick={() => setOpen(false)}>
              <IconX size={16} className="text-foreground/50" />
            </button>
          </div>
          <AlertDialogDescription>
            Puedes usar imágenes para complementar la pregunta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FileUploader
          maxFileCount={1}
          maxSize={8 * 1024 * 1024}
          onValueChange={setFiles}
          onUpload={uploadImage}
          progresses={files.reduce(
            (acc, file) => {
              acc[file.name] = uploadProgress;
              return acc;
            },
            {} as Record<string, number>
          )}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
