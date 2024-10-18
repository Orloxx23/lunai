"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateTime } from "luxon";
import { useEditor } from "@/context/EditorContext";
import { IconArrowLeft, IconPencil } from "@tabler/icons-react";
import useDebounced from "@/hooks/use-debounced";
import { Button } from "@/components/ui/button";
import { useRouter } from "next-nprogress-bar";
import Topbar from "@/components/dashboard/editor/Topbar";

export default function ReviewPage({
  params,
}: {
  params: { id: string; responseId: string };
}) {
  const supabase = createClient();

  let router = useRouter();
  const { quiz, setQuiz } = useEditor();
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [questionsData, setQuestionsData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: response, error: responseError } = await supabase
        .from("quiz_responses")
        .select("quizId, userId, score, createdAt")
        .eq("id", params.responseId)
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
      });

      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, title, description, type, options (id, title, isCorrect)")
        .eq("quizId", response.quizId);

      if (questionsError) throw questionsError;

      const { data: userResponses, error: userResponsesError } = await supabase
        .from("question_responses")
        .select("questionId, answer, isCorrect, feedback")
        .eq("quizResponseId", params.responseId);

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
  }, [params.responseId, supabase]);

  const goBack = () => {
    router.push(`/dashboard/editor/${params.id}`);
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

  const handleChangeResult = async (questionId: any, isCorrect: boolean) => {
    const originalQuestionsData = [...questionsData];

    const updatedQuestionsData = originalQuestionsData.map((question) =>
      question.id === questionId
        ? {
            ...question,
            userAnswerData: { ...question.userAnswerData, isCorrect },
          }
        : question
    );

    setQuestionsData(updatedQuestionsData);

    const newScore = updatedQuestionsData.filter(
      (question) => question.userAnswerData.isCorrect
    ).length;

    setLoadingChanges(true);

    try {
      const { error } = await supabase
        .from("question_responses")
        .update({ isCorrect })
        .eq("questionId", questionId)
        .eq("quizResponseId", params.responseId);

      if (error) throw error;

      const { error: scoreError } = await supabase
        .from("quiz_responses")
        .update({ score: newScore })
        .eq("id", params.responseId);

      if (scoreError) throw scoreError;

      fetchData(); // Refresh data after success.
    } catch (error) {
      console.error("Error updating result:", error);
      setQuestionsData(originalQuestionsData);
    } finally {
      setLoadingChanges(false);
    }
  };

  return (
    <>
      <Topbar />
      <div className="max-w-3xl mx-auto flex flex-col gap-4 py-4 pt-[calc(7vh+1rem)]">
        <Button onClick={goBack}>
          <IconArrowLeft size={24} />
        </Button>

        {userData && (
          <div className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300">
            <div className="flex items-center justify-center gap-4">
              <Avatar>
                <AvatarImage src={userData.avatar} />
                <AvatarFallback>
                  {userData.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="w-full">
                <div className="w-ful flex items-center justify-between">
                  <p className="text-2xl font-semibold">{userData.username}</p>
                  <p className="text-2xl text-foreground">
                    {userData.score}/{questionsData.length}
                  </p>
                </div>
                <div className="w-ful flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {userData.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {DateTime.fromISO(userData.createdAt)
                      .setLocale("es")
                      .toLocaleString(DateTime.DATETIME_MED)}
                  </p>
                </div>
              </div>
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
                    />
                    <Label htmlFor={option.id}>{option.title}</Label>
                  </div>
                ))
              )}
            </RadioGroup>

            <Select
              disabled={loadingChanges}
              value={question.userAnswerData.isCorrect ? "true" : "false"}
              onValueChange={(e) => {
                handleChangeResult(question.id, e === "true");
              }}
            >
              <SelectTrigger className={`w-full`}>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">
                  <span className="text-green-500 font-medium">Correcto</span>
                </SelectItem>
                <SelectItem value="false">
                  <span className="text-red-500 font-medium">Incorrecto</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <FeedbackTextarea
              questionId={question.id}
              quizResponseId={params.responseId}
              initialFeedback={question.userAnswerData?.feedback}
              loadingChanges={loadingChanges}
              setLoadingChanges={setLoadingChanges}
            />
          </div>
        ))}
      </div>
    </>
  );
}

interface FeedbackTextareaProps {
  questionId: any;
  quizResponseId: string;
  initialFeedback?: string;
  loadingChanges?: boolean;
  setLoadingChanges: (loading: boolean) => void;
}

export const FeedbackTextarea: React.FC<FeedbackTextareaProps> = ({
  questionId,
  quizResponseId,
  initialFeedback = "",
  loadingChanges = false,
  setLoadingChanges,
}) => {
  const supabase = createClient();
  const [feedback, setFeedback] = useState(initialFeedback);
  const debouncedFeedback = useDebounced(feedback, 500);

  useEffect(() => {
    const updateFeedback = async () => {
      if (
        debouncedFeedback !== undefined &&
        debouncedFeedback !== initialFeedback
      ) {
        setLoadingChanges(true);
        const { error } = await supabase
          .from("question_responses")
          .update({ feedback: debouncedFeedback })
          .eq("questionId", questionId)
          .eq("quizResponseId", quizResponseId);

        if (error) {
          console.error(error);
          // En caso de error, considerar mostrar un mensaje de error o revertir el estado
          setLoadingChanges(false);
        }
        setLoadingChanges(false);
      }
    };

    updateFeedback();
  }, [
    debouncedFeedback,
    questionId,
    quizResponseId,
    initialFeedback,
    supabase,
  ]);

  return (
    <div className="w-full relative">
      <textarea
        disabled={loadingChanges}
        className="text-sm text-foreground p-2 bg-accent rounded-md w-full resize-none"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Escribe retroalimentación aquí..."
        rows={5}
      />
    </div>
  );
};
