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
  calculateWeight: (questionId: string) => number;
  toggleAutoScoring: () => Promise<void>;
  isQuizReady: boolean;
  autoScoring: boolean;
  loading: boolean;
};

const EditorContext = createContext<MyContextData | undefined>(undefined);

const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [quiz, setQuiz] = useState<Quiz>({
    id: "",
    name: "",
    title: "",
    description: "",
    isPublic: false,
    state: "exclusive",
    maxScore: 0,
    autoScoring: true,
  });
  const [maxScore, setMaxScore] = useState<number>(quiz.maxScore);
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

  // --- Cargar cuestionario desde la URL ---
  useEffect(() => {
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    if (id && id !== "editor") {
      getQuiz(id);
    }
  }, [pathname]);

  // --- Forzar recarga del cuestionario desde la DB si existe quiz.id ---
  useEffect(() => {
    if (quiz.id) {
      getQuiz(quiz.id);
    }
  }, [quiz.id]);

  const updateQuiz = (key: keyof Quiz, value: any) => {
    setQuiz((prev) => ({ ...prev, [key]: value }));
  };

  const getQuiz = async (id: string) => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error obteniendo el cuestionario", error);
    }
    if (data) {
      // Si maxScore es menor a 1, se asigna 0 por defecto
      const validMaxScore = data.maxScore < 1 ? 0 : data.maxScore;
      setQuiz({ ...data, maxScore: validMaxScore });
      setAutoScoring(data.autoScoring);
      setMaxScore(validMaxScore);
    }
    setTimeout(() => setLoading(false), 700);
  };

  const createQuiz = async () => {
    setCreating(true);
    const name = await generateProjectName();
    if (!name) return;
    // Asegurar que maxScore es válido antes de insertar
    const validMaxScore = maxScore < 1 ? 0 : maxScore;
    const { data, error } = await supabase
      .from("quizzes")
      .insert([
        { name, autoScoring: quiz.autoScoring, maxScore: validMaxScore },
      ])
      .select();
    if (error) {
      console.error("Error creando el cuestionario", error);
      setCreating(false);
      return;
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
    setTimeout(() => setCreating(false), 1000);
  };

  // Guardar el cuestionario con maxScore validado (debe ser >= 1)
  const saveQuiz = async () => {
    if (!quiz?.id) return;
    const publicStatus = isQuizReady ? debouncedQuiz?.isPublic : false;
    setSaving(true);
    const validScore = maxScore < 1 ? 0 : maxScore;
    const { error } = await supabase
      .from("quizzes")
      .update({
        name: debouncedQuiz?.name,
        title: debouncedQuiz?.title,
        description: debouncedQuiz?.description,
        state: debouncedQuiz?.state,
        autoScoring: debouncedQuiz?.autoScoring,
        isPublic: publicStatus,
        maxScore: validScore,
      })
      .eq("id", debouncedQuiz?.id)
      .select();
    if (error) {
      console.error("Error guardando el cuestionario", error);
    }
    setSaving(false);
  };

  const getQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quizId", quiz?.id);
    if (error) {
      console.error("Error obteniendo las preguntas", error);
      return;
    }
    if (data) {
      setQuestions(data);
    }
  };

  // Distribuir los pesos basados en un maxScore válido
  const distributeWeights = (qs: Question[], maxScoreValue: number) => {
    const count = qs.length;
    if (count === 0) return qs;
    const weight = parseFloat((maxScoreValue / count).toFixed(2));
    return qs.map((q) => ({ ...q, weight }));
  };

  const validateWeights = () => {
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    return totalWeight.toFixed(2) === debouncedScore.toFixed(2);
  };

  const updateQuestionWeight = (questionId: string, newWeight: number) => {
    if (quiz.autoScoring) {
      setScoreError(
        "La evaluación automática está activada; la edición manual de pesos está deshabilitada."
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
        `Los pesos totales (${totalWeight.toFixed(2)}) exceden el puntaje máximo de ${debouncedScore}`
      );
      return;
    } else {
      setScoreError(
        `Los pesos totales (${totalWeight.toFixed(2)}) no alcanzan el puntaje máximo de ${debouncedScore}`
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
    return missingWeight < 0 ? 0 : parseFloat(missingWeight.toFixed(2));
  };

  // Alternar la evaluación automática y recalcular los pesos si es necesario
  const toggleAutoScoring = async () => {
    const newVal = !quiz.autoScoring;
    setQuiz((prev) => ({ ...prev, autoScoring: newVal }));
    if (newVal && questions.length > 0) {
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
      console.error("Error creando la pregunta", error);
      setQuestions((prev) => prev.filter((q) => q.id !== newQuestion.id));
    } else if (quiz.autoScoring && debouncedScore) {
      await Promise.all(
        newQuestions.map((q) =>
          supabase.from("questions").update({ weight: q.weight }).eq("id", q.id)
        )
      );
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
      console.error("Error eliminando la pregunta", error);
      getQuestions();
    } else if (quiz.autoScoring && debouncedScore) {
      const newQuestions = distributeWeights(tempQuestions, debouncedScore);
      setQuestions(newQuestions);
      await Promise.all(
        newQuestions.map((q) =>
          supabase.from("questions").update({ weight: q.weight }).eq("id", q.id)
        )
      );
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
      console.error("Error actualizando la pregunta", error);
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
            console.error("Error creando la pregunta", questionError);
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
              console.error("Error creando la opción", optionError);
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
      console.error("Error generando las preguntas", err);
    } finally {
      setGenerating(false);
    }
  };

  // Actualizar isQuizReady y el mensaje de error basado en los pesos y maxScore
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
        `Los pesos totales (${totalWeight.toFixed(2)}) no coinciden con el puntaje máximo de ${debouncedScore} o alguna pregunta está por debajo del mínimo.`
      );
    } else {
      setScoreError("");
    }
  }, [questions, debouncedScore, quiz.autoScoring]);

  // Actualizar isPublic basado en el estado de isQuizReady
  useEffect(() => {
    if (!quiz.id) return;
    if (isQuizReady && !quiz.isPublic) {
      updateQuiz("isPublic", true);
      (async () => {
        const { error } = await supabase
          .from("quizzes")
          .update({ isPublic: true })
          .eq("id", quiz.id);
        if (error) console.error("Error actualizando isPublic a true", error);
      })();
    } else if (!isQuizReady && quiz.isPublic) {
      updateQuiz("isPublic", false);
      (async () => {
        const { error } = await supabase
          .from("quizzes")
          .update({ isPublic: false })
          .eq("id", quiz.id);
        if (error) console.error("Error actualizando isPublic a false", error);
      })();
    }
  }, [isQuizReady, quiz.id, quiz.isPublic]);

  // Actualizar maxScore en la DB y redistribuir los pesos si está en modo de evaluación automática
  useEffect(() => {
    if (!quiz.id) return;
    // Validar debouncedScore; si es menor a 1, asignar 0 por defecto y salir del efecto.
    if (debouncedScore < 1) {
      setMaxScore(0);
      return;
    }
    updateQuiz("maxScore", debouncedScore);
    (async () => {
      const { error } = await supabase
        .from("quizzes")
        .update({ maxScore: debouncedScore })
        .eq("id", quiz.id);
      if (error) {
        console.error("Error actualizando maxScore", error);
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

  // Cargar preguntas una vez que el cuestionario esté disponible
  useEffect(() => {
    if (!quiz || !quiz.id || questionsGeted) return;
    getQuestions();
    setQuestionsGeted(true);
  }, [quiz, questionsGeted]);

  // Guardar cambios cuando el cuestionario cambia (debounced)
  useEffect(() => {
    if (!quiz) return;
    const saveIfChanged = async () => {
      if (!quiz || !debouncedQuiz || quiz.id !== debouncedQuiz.id) return;
      await saveQuiz();
    };
    document.title = quiz.id
      ? `${quiz?.name || "Cuestionario sin nombre"} - ${APP_NAME}`
      : `${APP_NAME}: El poder del conocimiento con IA`;
    saveIfChanged();
  }, [debouncedQuiz, pathname, quiz]);

  // Limpiar preguntas al cambiar de ruta
  useEffect(() => {
    setQuestionsGeted(false);
    setQuestions([]);
  }, [pathname]);

  // Sincronizar el estado local de autoScoring con el estado del cuestionario
  useEffect(() => {
    setMaxScore(quiz.maxScore);
    setAutoScoring(quiz.autoScoring);
  }, [quiz]);

  useEffect(() => {
    if (pathname !== "/dashboard/editor") {
      // Reiniciar el cuestionario y configuraciones para preparar un nuevo cuestionario o editar otro
      setQuiz({
        id: "",
        name: "",
        title: "",
        description: "",
        isPublic: false,
        state: "exclusive",
        maxScore: 0,
        autoScoring: true,
      });

      setQuestions([]);
      setQuestionsGeted(false);
      setSaving(false);
      setCreating(false);
      setScoreError("");
      setIsQuizReady(false);
      setAutoScoring(true);
      setLoading(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (autoScoring && questions.length > 0) {
      (async () => {
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
    throw new Error("useEditor debe usarse dentro de un EditorProvider");
  }
  return context;
};

export { EditorProvider, useEditor };
