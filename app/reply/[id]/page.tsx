import { APP_NAME } from "@/lib/constants/general";
import { Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/server";
import { Metadata, ResolvingMetadata } from "next";
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
    title: `${(data as Quiz)?.title}`,
    description: data?.description || "Potenciado por " + APP_NAME,
  };
}

export default function ReplyPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full min-h-screen bg-accent p-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">a</div>
    </div>
  );
}
