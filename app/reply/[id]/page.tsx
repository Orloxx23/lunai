import ReplyBody from "@/components/reply/ReplyBody";
import { APP_NAME } from "@/lib/constants/general";
import { Option, Question, Quiz } from "@/lib/types/editorTypes";
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
    title: `${(data as Quiz)?.title}`,
    description: data?.description || "Potenciado por " + APP_NAME,
  };
}

export default async function ReplyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const auth = await supabase.auth.getUser();
  const user = auth?.data.user;

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return redirect("/404");
  }

  if (quiz.state === "private" && quiz.authorId !== user?.id) {
    return redirect("/404");
  }

  let questions: Question[] = [];
  if (quiz) {
    const { data } = await supabase
      .from("questions")
      .select("id, title, description, type, quizId, position")
      .eq("quizId", quiz.id);

    questions = data || [];
  }

  let options: Option[] = [];
  if (questions) {
    const { data } = await supabase
      .from("options")
      .select("id, title, questionId, description")
      .in(
        "questionId",
        questions.map((q) => q.id)
      );

    options = data || [];
  }

  return (
    <div className="w-full min-h-screen bg-accent p-4">
      <ReplyBody
        quiz={quiz}
        questions={questions}
        options={options}
        user={user}
      />
    </div>
  );
}
