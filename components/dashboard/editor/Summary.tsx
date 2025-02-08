"use client";

import { useEditor } from "@/context/EditorContext";
import { createClient } from "@/utils/supabase/client";
import React, { useCallback, useEffect, useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface OptionSummary {
  id: string;
  title: string;
  count: number;
}

interface QuestionSummary {
  id: string;
  title: string;
  type: string;
  options: OptionSummary[];
  correctAnswers: number;
  incorrectAnswers: number;
  openAnswers: string[];
}

interface Props {
  updates: any[];
}

const generateDistinctColors = (count: number): string[] => {
  const baseHues = [0, 200, 50, 180, 270]; // Rojos, azules, amarillos, cyan, morado
  const colors: string[] = [];

  while (colors.length < count) {
    const hue =
      baseHues[colors.length % baseHues.length] +
      Math.floor(Math.random() * 20 - 10); // Pequeña variación
    const saturation = Math.floor(Math.random() * 20) + 70; // 70% - 90% (colores vivos)
    const lightness = Math.floor(Math.random() * 15) + 55; // 55% - 70% (para no ser opacos)

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    if (!colors.includes(color)) {
      colors.push(color);
    }
  }

  return colors;
};

export default function Summary({ updates }: Props) {
  const { quiz } = useEditor();
  const supabase = createClient();
  const [questionsSummary, setQuestionsSummary] = useState<QuestionSummary[]>(
    []
  );

  const fetchData = useCallback(async () => {
    if (!quiz?.id) return;

    try {
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, title, type, options (id, title, isCorrect)")
        .eq("quizId", quiz.id);

      if (questionsError) throw questionsError;

      const { data: quizResponses, error: quizResponsesError } = await supabase
        .from("quiz_responses")
        .select("id")
        .eq("quizId", quiz.id);

      if (quizResponsesError) throw quizResponsesError;

      const { data: questionResponses, error: questionResponsesError } =
        await supabase
          .from("question_responses")
          .select("questionId, answer, isCorrect")
          .in(
            "quizResponseId",
            quizResponses.map((res) => res.id)
          );

      if (questionResponsesError) throw questionResponsesError;

      const responseMap = questionResponses || [];

      const questionsSummary = questions.map((question) => {
        const summary: QuestionSummary = {
          id: question.id,
          title: question.title,
          type: question.type,
          options: question.options.map((opt) => ({
            id: opt.id,
            title: opt.title,
            count: 0,
          })),
          correctAnswers: 0,
          incorrectAnswers: 0,
          openAnswers: [],
        };

        responseMap.forEach((response) => {
          if (response.questionId !== question.id) return;
          if (response.isCorrect) {
            summary.correctAnswers += 1;
          } else {
            summary.incorrectAnswers += 1;
          }
          const selectedOption = summary.options.find(
            (opt) => opt.id === response.answer
          );
          if (selectedOption) {
            selectedOption.count += 1;
          }
          if (question.type === "open") {
            summary.openAnswers.push(response.answer);
          }
        });

        return summary;
      });

      setQuestionsSummary(questionsSummary);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [quiz, updates]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!questionsSummary.length) {
    return <div>Cargando...</div>;
  }

  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#C9CBCF",
    "#7CDDDD",
    "#A4A4A4",
    "#B39DDB",
  ];

  return (
    <div className="space-y-4">
      {questionsSummary.map((question, qIndex) => (
        <>
          {(question.type === "multiple" || question.type === "true/false") && (
            <div
              className="flex flex-col gap-4 bg-background rounded-md border p-4 w-full"
              key={question.id}
            >
              <p className="font-semibold text-xl text-center md:text-left">
                {question.title}
              </p>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <ChartContainer
                  config={
                    question.options.length === 2
                      ? { type: { label: "bar" }, dataKey: { label: "count" } }
                      : { type: { label: "pie" } }
                  }
                  className="w-full md:w-2/3 flex justify-center"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={question.options}
                      dataKey="count"
                      nameKey="title"
                      stroke="0"
                    >
                      {question.options.map((_, index) => (
                        <Cell
                          key={index}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="w-full md:w-1/3">
                  <div className="flex flex-col gap-2 justify-start items-start mx-auto w-fit sm:w-auto">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-2 justify-center md:justify-start"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor:
                              colors[
                                question.options.indexOf(option) % colors.length
                              ],
                          }}
                        ></div>
                        <span className="text-sm">{option.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {question.type === "open" && (
            <div className="flex flex-col gap-2 bg-background rounded-md border p-4">
              <p className="font-semibold text-xl">{question.title}</p>
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {question.openAnswers.map((answer, index) => (
                  <div key={index} className="p-2 bg-accent rounded-md">
                    {answer}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ))}
    </div>
  );
}
