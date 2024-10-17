import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

export default async function ReviewLayout({
  params,
  children,
}: {
  params: { id: string };
  children: React.ReactNode;
}) {
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

  // Si el usuario no es el autor del quiz
  if (quizData.authorId !== userId) {
    redirect("/dashboard");
  }

  if (!quizData || !userId) {
    // Si no hay datos o el usuario no está autenticado, redirigir
    redirect("/dashboard");
  }
  return <>{children}</>;
}
