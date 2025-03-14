"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import MainInfo from "./MainInfo";
import { Option, Question, Quiz } from "@/lib/types/editorTypes";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { APP_NAME } from "@/lib/constants/general";
import { IconCheck, IconLoader2, IconPencil, IconX } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Loader from "./Loader";
import { PortalEffect } from "../dashboard/editor/Generator";
import { Separator } from "../ui/separator";
import { remark } from "remark";
import html from "remark-html";

export async function markdownToHtml(markdown: string) {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

interface Props {
  quiz: Quiz;
  questions: Question[];
  options: Option[];
  user: User | null;
}

type Result = {
  score: number;
  email: string;
  generalFeedback: string;
  results: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    feedback: string;
  }[];
};

export default function QuizForm({ quiz, questions, options, user }: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [htmlFeedback, setHtmlFeedback] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    answers: z.record(z.union([z.string().min(1, "Obligatorio"), z.boolean()])),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
      answers: questions.reduce(
        (acc, question) => {
          acc[question.id] = "";
          return acc;
        },
        {} as Record<string, string | boolean>
      ),
    },
  });

  async function onSubmit(values: FormValues) {
    if (finished) return;

    setLoading(true);
    setOpen(true);
    const res = await fetch(`/api/get-result`, {
      method: "POST",
      body: JSON.stringify({ ...values, quizId: quiz.id }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    setResult(data);
    setFinished(true);

    setLoading(false);
  }

  const renderQuestionInput = (question: Question, field: any) => {
    switch (question.type) {
      case "multiple":
        const questionOptions = options.filter(
          (option) => option.questionId === question.id
        );

        if (question.title.trim().length > 0 && questionOptions.length > 1) {
          return (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-col space-y-1"
            >
              {options
                .filter((option) => option.questionId === question.id)
                .map(
                  (option) =>
                    option.title.trim().length > 0 && (
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        key={option.id}
                      >
                        <FormControl>
                          <RadioGroupItem value={option.id} />
                        </FormControl>
                        <FormLabel className="text-base font-normal">
                          {option.title}
                        </FormLabel>
                      </FormItem>
                    )
                )}
            </RadioGroup>
          );
        } else {
          return null;
        }
      case "open":
        return <Textarea {...field} placeholder="Ingresa tu respuesta aqui" />;
    }
  };

  useEffect(() => {
    if (result?.generalFeedback) {
      markdownToHtml(result.generalFeedback).then(setHtmlFeedback);
    }
  }, [result?.generalFeedback]);

  return (
    <>
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {quiz.authorId === user?.id && (
          <Button
            onClick={() => {
              window.open(`/dashboard/editor/${quiz.id}`, "_self");
            }}
            size={"icon"}
            className="rounded-full fixed bottom-4 right-4"
          >
            <IconPencil size={24} />
          </Button>
        )}

        <MainInfo quiz={quiz} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email"
                        {...field}
                        disabled={user !== null || finished}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {questions
              .sort((a, b) => a.position - b.position)
              .map((question) => {
                return question.title.trim().length > 0 &&
                  (question.type === "open" ||
                    options.filter((o) => o.questionId === question.id).length >
                      1) ? (
                  <div
                    key={question.id}
                    className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300"
                  >
                    {question.image && (
                      <img
                        src={question.image}
                        alt="Question image"
                        className="w-full rounded-md object-cover max-h-96 mx-auto mb-2 bg-accent"
                        draggable={false}
                        height={384}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name={`answers.${question.id}`}
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-xl">
                            {question.title}{" "}
                            <span className="text-xs font-normal">{`(${question.weight} pts)`}</span>
                          </FormLabel>
                          <FormControl
                            className={
                              finished
                                ? "pointer-events-none"
                                : "pointer-events-auto"
                            }
                          >
                            {renderQuestionInput(question, field)}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {finished && !loading && result && (
                      <div className="flex flex-col gap-2">
                        {result?.results?.find(
                          (r) => r.questionId === question.id
                        )?.isCorrect ? (
                          <div className="rounded-md flex gap-2 items-center p-2 bg-green-500/10">
                            <IconCheck className="text-green-500" />
                            <div className="text-green-500 font-medium">
                              Correcto
                            </div>
                            <div className="flex-1"></div>
                            <div className="text-green-500 font-medium">
                              +{question.weight} pts
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-md flex gap-2 items-center p-2 bg-red-500/10">
                            <IconX className="text-red-500" />
                            <div className="text-red-500 font-medium">
                              Incorrecto
                            </div>
                          </div>
                        )}
                        <div className="text-sm text-foreground p-2 bg-accent rounded-md">
                          {result?.results?.find(
                            (r) => r.questionId === question.id
                          )?.feedback ||
                            (question.type === "open" &&
                              "No feedback provided")}
                        </div>
                      </div>
                    )}

                    <div className="w-full text-xs flex items-center justify-end text-foreground/40">
                      {question.position + 1}/
                      {
                        questions.filter(
                          (q) =>
                            q.title.trim().length > 0 &&
                            (q.type === "open" ||
                              options.filter((o) => o.questionId === q.id)
                                .length > 1)
                        ).length
                      }
                    </div>
                  </div>
                ) : (
                  <></>
                );
              })}

            <Button
              disabled={loading || finished || !user}
              type="submit"
              className="w-full"
            >
              {loading ? <IconLoader2 className="animate-spin" /> : "Enviar"}
            </Button>
          </form>
        </Form>

        <footer className="text-center text-xs">
          Potenciado por{" "}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            {APP_NAME}
          </a>
        </footer>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-3xl aspect-square bg-transparent border-0">
          <div className="size-full bg-primary absolute top-0 left-0 blur-2xl opacity-20"></div>
          <AlertDialogHeader className="hidden">
            <AlertDialogTitle></AlertDialogTitle>
            <AlertDialogDescription></AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center items-center rounded-2xl overflow-hidden relative shadow-2xl shadow-primary">
            <PortalEffect className="absolute z-0" />
            <div className="size-[70%] bg-background relative z-10 rounded-xl flex flex-col justify-center items-center gap-4 shadow-2xl">
              {loading ? (
                <>
                  <Loader />

                  <p className="text-sm text-primary w-2/3 text-center font-bold animate-pulse absolute bottom-4">
                    Estamos procesando tus respuestas, por favor espera un
                    momento...
                  </p>
                </>
              ) : (
                <div className="flex flex-col gap-4 p-8 size-full justify-center items-center">
                  <div className="text-7xl font-bold flex items-center justify-center gap-2 ">
                    <p className="text-primary">
                      {result?.score}
                    </p>
                  </div>
                  <div className="w-full flex-1 overflow-y-auto p-4 bg-accent rounded-md font-mono">
                    {htmlFeedback && (
                      <div dangerouslySetInnerHTML={{ __html: htmlFeedback }} />
                    )}
                  </div>
                  <Separator />
                  <Button
                    onClick={() => {
                      setOpen(false);
                    }}
                    className="w-full"
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
