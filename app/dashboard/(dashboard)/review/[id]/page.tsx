"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateTime } from "luxon";
import { useEditor } from "@/context/EditorContext";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next-nprogress-bar";
import Topbar from "@/components/dashboard/editor/Topbar";

export default function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  let router = useRouter();
  const { quiz, setQuiz } = useEditor();
  const [questionsData, setQuestionsData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: response, error: responseError } = await supabase
        .from("quiz_responses")
        .select("quizId, userId, score, createdAt, feedback")
        .eq("id", params.id)
        .single();

      if (responseError) throw responseError;

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("username, email, avatar")
        .eq("id", response.userId)
        .single();

      if (userError) throw userError;

      setUserData({
        ...user,
        score: response.score,
        createdAt: response.createdAt,
        feedback: response.feedback,
      });

      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, title, description, type, options (id, title, isCorrect)")
        .eq("quizId", response.quizId);

      if (questionsError) throw questionsError;

      const { data: userResponses, error: userResponsesError } = await supabase
        .from("question_responses")
        .select("questionId, answer, isCorrect, feedback")
        .eq("quizResponseId", params.id);

      if (userResponsesError) throw userResponsesError;

      const questionsWithResponses = questions.map((question) => {
        const userResponse = userResponses.find(
          (response) => response.questionId === question.id
        );
        return {
          ...question,
          userAnswer: userResponse?.answer,
          userAnswerData: userResponse,
        };
      });

      setQuestionsData(questionsWithResponses);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [params.id, supabase]);

  const goBack = () => {
    router.push(`/dashboard`);
  };

  useEffect(() => {
    const getQuiz = async () => {
      if (!quiz?.id) {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", params.id)
          .single();

        if (!error && data) setQuiz(data);
      }
    };

    getQuiz();
  }, [quiz, params.id, supabase, setQuiz]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <div className="max-w-3xl mx-auto flex flex-col gap-4 py-4">
        <Button onClick={goBack}>
          <IconArrowLeft size={24} />
        </Button>

        {userData && (
          <div className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-5xl text-foreground">
                {userData.score}/{questionsData.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {DateTime.fromISO(userData.createdAt)
                  .setLocale("es")
                  .toLocaleString(DateTime.DATETIME_MED)}
              </p>
              <div className="w-full">{userData.feedback}</div>
            </div>
          </div>
        )}

        {questionsData.map((question) => (
          <div
            key={question.id}
            className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300"
          >
            <h3 className="text-xl font-medium">{question.title}</h3>
            <p>{question.description}</p>
            <RadioGroup defaultValue="comfortable" disabled>
              {question.type === "open" ? (
                <p className="italic">{question.userAnswer}</p>
              ) : (
                question.options.map((option: any) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      checked={question.userAnswer === option.id}
                      disabled
                    />
                    <Label htmlFor={option.id}>{option.title}</Label>
                  </div>
                ))
              )}
            </RadioGroup>
            <p className="text-sm text-foreground">
              {question?.userAnswerData?.isCorrect ? (
                <div className="rounded-md flex gap-2 items-center p-2 bg-green-500/10">
                  <IconCheck className="text-green-500" />
                  <div className="text-green-500 font-medium">Correcto</div>
                </div>
              ) : (
                <div className="rounded-md flex gap-2 items-center p-2 bg-red-500/10">
                  <IconX className="text-red-500" />
                  <div className="text-red-500 font-medium">Incorrecto</div>
                </div>
              )}
            </p>
            <div className="w-full relative">
              <textarea
                disabled
                className="text-sm text-foreground p-2 bg-accent rounded-md w-full resize-none"
                value={question.userAnswerData.feedback || ""}
                placeholder="Sin retroalimentación"
                rows={5}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
