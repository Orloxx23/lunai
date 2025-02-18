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
  calculateWeight: (currentWeight: number) => number;
};

const EditorContext = createContext<MyContextData | undefined>(undefined);

const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  let router = useRouter();
  let pathname = usePathname();

  const [quiz, setQuiz] = useState<Quiz>({
    id: "",
    name: "",
    title: "",
    description: "",
    isPublic: false,
    state: "private",
    maxScore: 100,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<Option[]>([]);
  const [generating, setGenerating] = useState(false);

  const [questionsGeted, setQuestionsGeted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [scoreError, setScoreError] = useState("");

  const debouncedQuiz = useDebounced(quiz, 700);

  const updateQuiz = (key: keyof Quiz, value: any) => {
    setQuiz((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const getQuiz = async (id: string) => {
    const supabase = createClient();
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
    }
  };

  const createQuiz = async () => {
    const supabase = createClient();
    setCreating(true);

    const name = await generateProjectName();

    if (!name) return;

    const { data, error } = await supabase
      .from("quizzes")
      .insert([{ name }])
      .select();

    if (error) {
      console.error("Error creating quiz", error);
      setCreating(false);
    }

    if (data) {
      setQuiz((prev) => {
        return {
          ...prev,
          id: data[0].id,
          name: data[0].name,
        };
      });
      router.push(`/dashboard/editor/${data[0].id}`);
    }

    setTimeout(() => {
      setCreating(false);
    }, 1000);
  };

  const saveQuiz = async () => {
    if (!quiz?.id) return; // No guardes si no hay ID
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    if (totalWeight !== quiz?.maxScore) {
      setScoreError(
        `El total de los pesos (${totalWeight.toFixed(2)}) no coincide con el puntaje máximo de ${quiz?.maxScore}`
      );
    }

    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("quizzes")
      .update({
        name: debouncedQuiz?.name,
        title: debouncedQuiz?.title,
        description: debouncedQuiz?.description,
        state: debouncedQuiz?.state,
      })
      .eq("id", debouncedQuiz?.id)
      .select();

    if (error) {
      console.error("Error saving quiz", error);
      return;
    }

    if (data) {
    }

    setSaving(false);
  };

  const getQuestions = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quizId", quiz?.id);

    if (error) {
      console.error("Error getting questions", error);
      return;
    }

    if (data) {
      // Respeta los pesos almacenados en la base de datos
      setQuestions(data);
    }
  };

  const createQuestion = async () => {
    if (questions.length > 0) {
      // Ajustar el peso de la última pregunta antes de agregar una nueva
      const lastQuestion = questions[questions.length - 1];
      const newWeightForLastQuestion = parseFloat(
        (lastQuestion.weight / 2).toFixed(2)
      ); // Dividimos el peso de la última pregunta

      // Actualizamos el peso de la última pregunta
      const updatedQuestions = questions.map((q, index) =>
        index === questions.length - 1
          ? { ...q, weight: newWeightForLastQuestion }
          : q
      );

      setQuestions(updatedQuestions);

      // Actualizamos el peso de la última pregunta en la base de datos
      const supabase = createClient();
      await supabase
        .from("questions")
        .update({ weight: newWeightForLastQuestion })
        .eq("id", lastQuestion.id);
    }

    // Crear la nueva pregunta con el mismo peso que la última pregunta ajustada
    const newQuestion: Question = {
      id: generateUUID(),
      title: "",
      type: "multiple",
      description: "",
      quizId: quiz?.id || "",
      position: questions.length,
      weight:
        questions.length > 0 ? questions[questions.length - 1].weight / 2 : 1, // Asignar el mismo peso que la última pregunta ajustada
    };

    // Agregar la nueva pregunta al estado
    setQuestions((prev) => [...prev, newQuestion]);

    // Guardar la nueva pregunta en la base de datos
    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .insert([newQuestion])
      .select();

    if (error) {
      console.error("Error creating question", error);
      setQuestions((prev) => prev.filter((q) => q.id !== newQuestion.id)); // Revertir si hay un error
    }

    if (data) {
      // Pregunta creada exitosamente
    }
  };

  const deleteQuestion = async (questionId: string) => {
    const questionToDelete: Question | null | undefined = questions.find(
      (q) => q.id === questionId
    );

    // Filtra la pregunta a eliminar
    const tempQuestions = questions.filter((q) => q.id !== questionId);
    setQuestions(tempQuestions);

    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .select();

    if (error) {
      console.error("Error deleting question", error);
      getQuestions();
    }

    if (data) {
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

    const supabase = createClient();
    const { error } = await supabase
      .from("questions")
      .update({ [key]: value })
      .eq("id", questionId);

    if (error) {
      console.error("Error updating question", error);
      getQuestions(); // Solo si hay error, recargar desde BD
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
            weight: 1,
          };

          const supabase = createClient();
          const { data: questionData, error: questionError } = await supabase
            .from("questions")
            .insert([newQuestion])
            .select();

          if (questionError) {
            console.error("Error creating question", questionError);
            return null; // Handle the question error by returning null
          }

          const optionsInserts = question.options.map(async (option: any) => {
            const newOption: Option = {
              id: generateUUID(),
              title: option.title,
              description: option.description || "",
              isCorrect: option.isCorrect,
              questionId: newQuestion.id,
            };

            const { data: optionData, error: optionError } = await supabase
              .from("options")
              .insert([newOption])
              .select();

            if (optionError) {
              console.error("Error creating option", optionError);
              return null; // Handle the option error
            }

            return newOption; // Return the newly created option
          });

          const options = await Promise.all(optionsInserts); // Wait for all options to be inserted
          setGeneratedOptions((prev) => [...prev, ...options.filter(Boolean)]); // Filter out nulls

          return newQuestion; // Return the newly created question
        }
      );

      const _questions = await Promise.all(questionInserts); // Wait for all questions to be inserted
      setQuestions((prev) => [...prev, ..._questions.filter(Boolean)]); // Filter out nulls

      if (callback) callback();
    } catch (err) {
      console.error("Error generating questions", err);
    } finally {
      setGenerating(false); // Ensure setGenerating is called finally
    }
  };

  // Función para distribuir pesos iniciales con 2 decimales
  const distributeWeights = (questions: Question[], maxScore: number) => {
    let weight = maxScore / questions.length;
    weight = parseFloat(weight.toFixed(2)); // Asegurar máximo 2 decimales
    return questions.map((q) => ({ ...q, weight }));
  };

  const validateWeights = () => {
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    return totalWeight.toFixed(2) === quiz?.maxScore.toFixed(2);
  };

  // Actualizar el peso de una pregunta con restricciones
  const updateQuestionWeight = (questionId: string, newWeight: number) => {
    newWeight = parseFloat(newWeight.toFixed(2)); // máximo 2 decimales

    const updatedQuestions = questions.map((q) =>
      q.id === questionId ? { ...q, weight: newWeight } : q
    );

    const totalWeight = updatedQuestions.reduce((sum, q) => sum + q.weight, 0);

    if (totalWeight > quiz?.maxScore) {
      setScoreError(
        `El total de los pesos (${totalWeight.toFixed(2)}) supera el puntaje máximo de ${quiz?.maxScore}`
      );
      return;
    } else if (totalWeight < quiz?.maxScore) {
      setScoreError(
        `El total de los pesos (${totalWeight.toFixed(2)}) no alcanza el puntaje máximo de ${quiz?.maxScore}`
      );
    } else {
      setScoreError("");
    }

    updateQuestion(questionId, "weight", newWeight);
    setQuestions(updatedQuestions);
  };

  const calculateWeight = (currentWeight: number) => {
    return (
      quiz?.maxScore -
      questions.reduce((sum, q) => sum + q.weight, 0) +
      currentWeight
    );
  };

  useEffect(() => {
    if (questions.length > 0 && quiz?.maxScore) {
      setQuestions(distributeWeights(questions, quiz.maxScore));
    }
  }, [quiz?.maxScore]); // Solo se ejecuta cuando cambia el puntaje máximo

  useEffect(() => {
    if (!quiz || !quiz.id || questionsGeted) return;

    getQuestions();
    setQuestionsGeted(true);

    return () => {
      // setQuestions([]);
      // setQuestionsGeted(false);
    };
  }, [quiz, questionsGeted]);

  useEffect(() => {
    if (!quiz) return;

    const saveIfChanged = async () => {
      if (!quiz || !debouncedQuiz || quiz.id !== debouncedQuiz.id) return;

      await saveQuiz();
    };

    if (pathname.includes("editor") && quiz.id) {
      document.title = `${quiz?.name || "Cuestionario sin nombre"} - ${APP_NAME}`;
    } else {
      document.title = `${APP_NAME}: El Poder del Conocimiento con Inteligencia Artificial`;
    }

    saveIfChanged();
  }, [debouncedQuiz]);

  useEffect(() => {
    setQuestionsGeted(false);
    setQuestions([]);
  }, [pathname]);

  return (
    <EditorContext.Provider
      value={{
        quiz,
        getQuiz,
        setQuiz,
        updateQuiz,
        saving,
        saveQuiz,
        createQuiz,
        creating,
        questions,
        setQuestions,
        createQuestion,
        deleteQuestion,
        updateQuestion,
        setSaving,
        generateQuestions,
        generatedOptions,
        generating,
        updateQuestionWeight,
        scoreError,
        calculateWeight,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

const useEditor = (): MyContextData => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error(
      "useMyContext debe ser utilizado dentro de un MyContextProvider"
    );
  }
  return context;
};

export { EditorProvider, useEditor };
