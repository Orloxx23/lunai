import EditorBody from "@/components/dashboard/editor/EditorBody";
import Topbar from "@/components/dashboard/editor/Topbar";
import { APP_NAME } from "@/lib/constants/general";
import { createClient } from "@/utils/supabase/server";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .single();

  return {
    title: `${data?.name} - ${APP_NAME}`,
  };
}

export default async function Editor({ params }: { params: { id: string } }) {
  const supabase = createClient();

  // Obtener los datos del quiz
  const { data: quizData, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .single();

  // Obtener el usuario autenticado
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id;

  if (!quizData || !userId) {
    // Si no hay datos o el usuario no está autenticado, redirigir
    redirect("/dashboard");
    return;
  }

  // Si el usuario es el autor del quiz
  if (quizData.authorId === userId) {
    return renderEditor(quizData);
  }

  // Verificar si el usuario es un colaborador del quiz
  const { data: partnerData, error: partnerError } = await supabase
    .from("quizPartners")
    .select("*")
    .eq("quizId", params.id)
    .eq("userId", userId);

  // Si el usuario es un colaborador
  if (partnerData && partnerData.length > 0) {
    return renderEditor(quizData);
  } else {
    // Si no es autor ni colaborador, redirigir
    redirect("/dashboard");
  }
}

// Función para renderizar el editor si el usuario tiene acceso
function renderEditor(quizData: any) {
  return (
    <div className="flex flex-col w-full min-h-screen bg-accent">
      <Topbar />
      <div className="w-full min-h-[93vh] bg-accent p-4 pt-[calc(7vh+1rem)]">
        <EditorBody quiz={quizData} />
      </div>
    </div>
  );
}
