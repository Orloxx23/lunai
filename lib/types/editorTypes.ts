import { User as SupaUser } from "@supabase/supabase-js";

export interface User extends SupaUser {
  createdAt: string;
  avatar: string;
  username: string;
  id: string;
}

export type Quiz = {
  id: string;
  name: string;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  authorId?: string;
  isPublic: boolean;
  state: "public" | "private" | "exclusive";
};

export type Question = {
  id: string;
  title: string;
  description: string;
  type: "multiple" | "open";
  quizId: string;
  createdAt?: string;
  correctAnswer?: string;
  image?: string;
};

export type Option = {
  id: string;
  title: string;
  description: string;
  isCorrect?: boolean;
  questionId: string;
  createdAt?: string;
};
