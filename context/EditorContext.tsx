"use client";

import useDebounced from "@/hooks/use-debounced";
import { APP_NAME } from "@/lib/constants/general";
import { generateProjectName, generateUUID } from "@/lib/functions/editor";
import { Option, Question, Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

type MyContextData = {
  quiz: Quiz | null;
  maxScore: number;
  setMaxScore: React.Dispatch<React.SetStateAction<number>>;
  getQuiz: (id: string) => void;
  setQuiz: (quiz: Quiz) => void;
  updateQuiz: (key: keyof Quiz, value: any) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  saveQuiz: () => void;
  createQuiz: () => void;
  creating: boolean;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  createQuestion: () => void;
  deleteQuestion: (questionId: string) => void;
  updateQuestion: (questionId: string, key: keyof Question, value: any) => void;
  generateQuestions: (
    amount: number,
    context: string,
    difficulty: string,
    callback?: (value?: any) => void
  ) => void;
  generatedOptions: Option[];
  generating: boolean;
  updateQuestionWeight: (questionId: string, newWeight: number) => void;
  scoreError: string;
  calculateWeight: (currentWeight: string) => number;
  toggleAutoScoring: () => Promise<void>;
  isQuizReady: boolean;
  autoScoring: boolean;
  loading: boolean;
};

const EditorContext = createContext<MyContextData | undefined>(undefined);

const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  let router = useRouter();
  let pathname = usePathname();

  // Estado del quiz (con valor inicial) y estado independiente para maxScore.
  // Nota: El valor inicial de maxScore es 100, pero al cargar el quiz se actualizará con el valor de la BD.
  const [quiz, setQuiz] = useState<Quiz>({
    id: "",
    name: "",
    title: "",
    description: "",
    isPublic: false,
    state: "exclusive",
    maxScore: -1,
    autoScoring: true,
  });
  const [maxScore, setMaxScore] = useState<number>(quiz.maxScore || -1);
  // Debouncing para maxScore: se espera 700ms antes de propagar el cambio.
  const debouncedScore = useDebounced(maxScore, 700);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<Option[]>([]);
  const [generating, setGenerating] = useState(false);
  const [questionsGeted, setQuestionsGeted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [isQuizReady, setIsQuizReady] = useState<boolean>(false);
  const [autoScoring, setAutoScoring] = useState<boolean>(quiz.autoScoring);
  const [loading, setLoading] = useState(true);

  const debouncedQuiz = useDebounced(quiz, 700);
  const supabase = createClient();

  // --- Efecto para cargar el quiz desde la URL ---
  useEffect(() => {
    // Suponiendo que la URL es /dashboard/editor/{quizId}
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    if (id && id !== "editor") {
      getQuiz(id);
    }
  }, [pathname]);

  // --- Nuevo efecto: si ya existe un quiz (su id no es vacío), forzamos cargarlo desde la BD ---
  useEffect(() => {
    if (quiz.id) {
      getQuiz(quiz.id);
    }
  }, [quiz.id]);

  const updateQuiz = (key: keyof Quiz, value: any) => {
    setQuiz((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getQuiz = async (id: string) => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error getting quiz", error);
    }
    if (data) {
      setQuiz(data);
      setAutoScoring(data.autoScoring);
      setMaxScore(data.maxScore);
    }
    setTimeout(() => {
      setLoading(false);
    }, 700);
  };

  const createQuiz = async () => {
    setCreating(true);
    const name = await generateProjectName();
    if (!name) return;
    // Insertamos name, autoScoring y maxScore en la BD
    const { data, error } = await supabase
      .from("quizzes")
      .insert([{ name, autoScoring: quiz.autoScoring, maxScore }])
      .select();
    if (error) {
      console.error("Error creating quiz", error);
      setCreating(false);
    }
    if (data) {
      setQuiz((prev) => ({
        ...prev,
        id: data[0].id,
        name: data[0].name,
        autoScoring: data[0].autoScoring,
        maxScore: data[0].maxScore,
      }));
      setMaxScore(data[0].maxScore);
      router.push(`/dashboard/editor/${data[0].id}`);
    }
    setTimeout(() => {
      setCreating(false);
    }, 1000);
  };

  // Al guardar, se actualiza maxScore usando debouncedScore.
  const saveQuiz = async () => {
    if (!quiz?.id) return;
    const publicStatus = isQuizReady ? debouncedQuiz?.isPublic : false;
    setSaving(true);
    const { error } = await supabase
      .from("quizzes")
      .update({
        name: debouncedQuiz?.name,
        title: debouncedQuiz?.title,
        description: debouncedQuiz?.description,
        state: debouncedQuiz?.state,
        autoScoring: debouncedQuiz?.autoScoring,
        isPublic: publicStatus,
        maxScore: maxScore === -1 ? undefined : maxScore,
      })
      .eq("id", debouncedQuiz?.id)
      .select();
    if (error) {
      console.error("Error saving quiz", error);
    }
    setSaving(false);
  };

  const getQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quizId", quiz?.id);
    if (error) {
      console.error("Error getting questions", error);
      return;
    }
    if (data) {
      setQuestions(data);
    }
  };

  // Reparte los pesos usando maxScore (del estado independiente).
  const distributeWeights = (qs: Question[], maxScore: number) => {
    const count = qs.length;
    if (count === 0) return qs;
    const weight = parseFloat((maxScore / count).toFixed(2));
    return qs.map((q) => ({ ...q, weight }));
  };

  const validateWeights = () => {
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    return totalWeight.toFixed(2) === debouncedScore.toFixed(2);
  };

  const updateQuestionWeight = (questionId: string, newWeight: number) => {
    if (quiz.autoScoring) {
      setScoreError(
        "El sistema de pesos está en automático, no se puede editar manualmente."
      );
      return;
    }
    newWeight = parseFloat(newWeight.toFixed(2));
    const updatedQuestions = questions.map((q) =>
      q.id === questionId ? { ...q, weight: newWeight } : q
    );
    const totalWeight = updatedQuestions.reduce((sum, q) => sum + q.weight, 0);
    const tolerance = 0.01;
    if (Math.abs(totalWeight - debouncedScore) <= tolerance) {
      setScoreError("");
    } else if (totalWeight > debouncedScore) {
      setScoreError(
        `El total de los pesos (${totalWeight.toFixed(2)}) supera el puntaje máximo de ${debouncedScore}`
      );
      return;
    } else {
      setScoreError(
        `El total de los pesos (${totalWeight.toFixed(2)}) no alcanza el puntaje máximo de ${debouncedScore}`
      );
    }
    updateQuestion(questionId, "weight", newWeight);
    setQuestions(updatedQuestions);
  };

  const calculateWeight = (questionId: string) => {
    const totalOther = questions.reduce(
      (sum, q) => (q.id === questionId ? sum : sum + q.weight),
      0
    );
    const missingWeight = maxScore - totalOther;

    if (missingWeight < 0) {
      return 0;
    }
    return parseFloat(missingWeight.toFixed(2));
  };

  // Cambia el modo de scoring. Si se activa el autoScoring, se recalculan los pesos si es necesario.
  const toggleAutoScoring = async () => {
    const newVal = !quiz.autoScoring;
    setQuiz((prev) => ({ ...prev, autoScoring: newVal }));
    if (newVal) {
      if (questions.length > 0) {
        const expectedWeight = parseFloat(
          (debouncedScore / questions.length).toFixed(2)
        );
        const needsUpdate = questions.some((q) => q.weight !== expectedWeight);
        if (needsUpdate) {
          const newQuestions = distributeWeights(questions, debouncedScore);
          setQuestions(newQuestions);
          await Promise.all(
            newQuestions.map((q) =>
              supabase
                .from("questions")
                .update({ weight: q.weight })
                .eq("id", q.id)
            )
          );
        }
      }
    }
    await supabase
      .from("quizzes")
      .update({ autoScoring: newVal })
      .eq("id", quiz.id);
  };

  const createQuestion = async () => {
    const newQuestion: Question = {
      id: generateUUID(),
      title: "",
      type: "multiple",
      description: "",
      quizId: quiz?.id || "",
      position: questions.length,
      weight: 0,
    };
    let newQuestions = [...questions, newQuestion];
    if (quiz.autoScoring && debouncedScore) {
      newQuestions = distributeWeights(newQuestions, debouncedScore);
    }
    setQuestions(newQuestions);
    const { data, error } = await supabase
      .from("questions")
      .insert([newQuestion])
      .select();
    if (error) {
      console.error("Error creating question", error);
      setQuestions((prev) => prev.filter((q) => q.id !== newQuestion.id));
    } else {
      if (quiz.autoScoring && debouncedScore) {
        await Promise.all(
          newQuestions.map((q) =>
            supabase
              .from("questions")
              .update({ weight: q.weight })
              .eq("id", q.id)
          )
        );
      }
    }
  };

  const deleteQuestion = async (questionId: string) => {
    const tempQuestions = questions.filter((q) => q.id !== questionId);
    setQuestions(tempQuestions);
    setSaving(true);
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .select();
    if (error) {
      console.error("Error deleting question", error);
      getQuestions();
    } else {
      if (quiz.autoScoring && debouncedScore) {
        const newQuestions = distributeWeights(tempQuestions, debouncedScore);
        setQuestions(newQuestions);
        await Promise.all(
          newQuestions.map((q) =>
            supabase
              .from("questions")
              .update({ weight: q.weight })
              .eq("id", q.id)
          )
        );
      }
    }
    setSaving(false);
  };

  const updateQuestion = async (
    questionId: string,
    key: keyof Question,
    value: any
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, [key]: value } : q))
    );
    setSaving(true);
    const { error } = await supabase
      .from("questions")
      .update({ [key]: value })
      .eq("id", questionId);
    if (error) {
      console.error("Error updating question", error);
      getQuestions();
    }
    setSaving(false);
  };

  const generateQuestions = async (
    amount: number,
    context: string,
    difficulty: string,
    callback?: (value?: any) => void
  ) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: JSON.stringify({ amount, context, difficulty }),
      });
      const data = await res.json();
      const questionInserts = data.questions.map(
        async (question: any, index: number) => {
          const newQuestion: Question = {
            id: generateUUID(),
            title: question.title,
            type: question.type,
            description: question.description || "",
            quizId: quiz?.id || "",
            correctAnswer: question.correctAnswer || null,
            position: questions.length + index,
            weight: 0,
          };
          const { error: questionError } = await supabase
            .from("questions")
            .insert([newQuestion])
            .select();
          if (questionError) {
            console.error("Error creating question", questionError);
            return null;
          }
          const optionsInserts = question.options.map(async (option: any) => {
            const newOption: Option = {
              id: generateUUID(),
              title: option.title,
              description: option.description || "",
              isCorrect: option.isCorrect,
              questionId: newQuestion.id,
            };
            const { error: optionError } = await supabase
              .from("options")
              .insert([newOption])
              .select();
            if (optionError) {
              console.error("Error creating option", optionError);
              return null;
            }
            return newOption;
          });
          const options = await Promise.all(optionsInserts);
          setGeneratedOptions((prev) => [...prev, ...options.filter(Boolean)]);
          return newQuestion;
        }
      );
      const _questions = await Promise.all(questionInserts);
      let updatedQuestions = [...questions, ..._questions.filter(Boolean)];
      if (quiz.autoScoring && debouncedScore) {
        updatedQuestions = distributeWeights(updatedQuestions, debouncedScore);
        await Promise.all(
          updatedQuestions.map((q) =>
            supabase
              .from("questions")
              .update({ weight: q.weight })
              .eq("id", q.id)
          )
        );
      }
      setQuestions(updatedQuestions);
      if (callback) callback();
    } catch (err) {
      console.error("Error generating questions", err);
    } finally {
      setGenerating(false);
    }
  };

  // Efecto para actualizar isQuizReady y el mensaje de error usando debouncedScore.
  useEffect(() => {
    if (questions.length === 0) return;
    if (quiz.autoScoring) {
      setIsQuizReady(true);
      setScoreError("");
      return;
    }
    const tolerance = 0.01;
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    const allHaveMinimum = questions.every((q) => q.weight >= 0.01);
    const ready =
      Math.abs(totalWeight - debouncedScore) <= tolerance && allHaveMinimum;
    setIsQuizReady(ready);
    if (!ready) {
      setScoreError(
        `El total de los pesos (${totalWeight.toFixed(2)}) no coincide con el puntaje máximo de ${debouncedScore} o alguna pregunta no cumple el mínimo.`
      );
    } else {
      setScoreError("");
    }
  }, [questions, debouncedScore, quiz.autoScoring]);

  // Efecto para actualizar isPublic según isQuizReady.
  useEffect(() => {
    if (!quiz.id) return;
    if (isQuizReady && !quiz.isPublic) {
      updateQuiz("isPublic", true);
      (async () => {
        const { error } = await supabase
          .from("quizzes")
          .update({ isPublic: true })
          .eq("id", quiz.id);
        if (error) {
          console.error("Error updating isPublic to true", error);
        }
      })();
    } else if (!isQuizReady && quiz.isPublic) {
      updateQuiz("isPublic", false);
      (async () => {
        const { error } = await supabase
          .from("quizzes")
          .update({ isPublic: false })
          .eq("id", quiz.id);
        if (error) {
          console.error("Error updating isPublic to false", error);
        }
      })();
    }
  }, [isQuizReady, quiz.id, quiz.isPublic]);

  // Efecto para actualizar el maxScore en la BD y, si está en autoScoring, redistribuir los pesos.
  useEffect(() => {
    if (!quiz.id) return;
    if (debouncedScore === -1) return;
    updateQuiz("maxScore", debouncedScore);
    (async () => {
      const { error } = await supabase
        .from("quizzes")
        .update({ maxScore: debouncedScore })
        .eq("id", quiz.id);
      if (error) {
        console.error("Error updating maxScore", error);
      }
      if (quiz.autoScoring && questions.length > 0) {
        const newQuestions = distributeWeights(questions, debouncedScore);
        setQuestions(newQuestions);
        await Promise.all(
          newQuestions.map((q) =>
            supabase
              .from("questions")
              .update({ weight: q.weight })
              .eq("id", q.id)
          )
        );
      }
    })();
  }, [debouncedScore, quiz.id, quiz.autoScoring, questions.length]);

  // Carga las preguntas una sola vez al tener el quiz.
  useEffect(() => {
    if (!quiz || !quiz.id || questionsGeted) return;
    getQuestions();
    setQuestionsGeted(true);
  }, [quiz, questionsGeted]);

  // Guarda cambios cuando cambia el quiz (debounced)
  useEffect(() => {
    if (!quiz) return;
    const saveIfChanged = async () => {
      if (!quiz || !debouncedQuiz || quiz.id !== debouncedQuiz.id) return;
      await saveQuiz();
    };
    document.title = quiz.id
      ? `${quiz?.name || "Cuestionario sin nombre"} - ${APP_NAME}`
      : `${APP_NAME}: El Poder del Conocimiento con Inteligencia Artificial`;
    saveIfChanged();
  }, [debouncedQuiz, pathname, quiz]);

  // Limpia preguntas al cambiar de ruta.
  useEffect(() => {
    setQuestionsGeted(false);
    setQuestions([]);
  }, [pathname]);

  // Sincroniza el estado local de autoScoring con el del quiz.
  useEffect(() => {
    setAutoScoring(quiz.autoScoring);
  }, [quiz]);

  useEffect(() => {
    if (autoScoring) {
      (async () => {
        if (questions.length > 0) {
          const expectedWeight = parseFloat(
            (debouncedScore / questions.length).toFixed(2)
          );
          const needsUpdate = questions.some(
            (q) => q.weight !== expectedWeight
          );
          if (needsUpdate) {
            const newQuestions = distributeWeights(questions, debouncedScore);
            setQuestions(newQuestions);
            await Promise.all(
              newQuestions.map((q) =>
                supabase
                  .from("questions")
                  .update({ weight: q.weight })
                  .eq("id", q.id)
              )
            );
          }
        }
      })();
    }
  }, [maxScore]);

  return (
    <EditorContext.Provider
      value={{
        quiz,
        maxScore,
        setMaxScore,
        getQuiz,
        setQuiz,
        updateQuiz,
        saving,
        setSaving,
        saveQuiz,
        createQuiz,
        creating,
        questions,
        setQuestions,
        createQuestion,
        deleteQuestion,
        updateQuestion,
        generateQuestions,
        generatedOptions,
        generating,
        updateQuestionWeight,
        scoreError,
        calculateWeight,
        toggleAutoScoring,
        isQuizReady,
        autoScoring,
        loading,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

const useEditor = (): MyContextData => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor debe ser utilizado dentro de un EditorProvider");
  }
  return context;
};

export { EditorProvider, useEditor };
