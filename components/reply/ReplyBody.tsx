"use client";

import React from "react";
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

interface Props {
  quiz: Quiz;
  questions: Question[];
  options: Option[];
  user: User | null;
}

export default function QuizForm({ quiz, questions, options, user }: Props) {
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

  function onSubmit(values: FormValues) {
    console.log(values);
    // Handle form submission logic here
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
        return <Textarea {...field} placeholder="Enter your answer here" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
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
                      disabled={user !== null}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {questions.map((question) => {
            return (
              <div
                key={question.id}
                className="w-full p-4 rounded-lg border bg-background flex flex-col gap-2 transition duration-300"
              >
                <FormField
                  control={form.control}
                  name={`answers.${question.id}`}
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xl">
                        {question.title}
                      </FormLabel>
                      <FormControl>
                        {renderQuestionInput(question, field)}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            );
          })}

          <Button type="submit" className="w-full">
            Enviar
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
  );
}
