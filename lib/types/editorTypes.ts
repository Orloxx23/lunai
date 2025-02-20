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
  folderId?: string;
  maxScore: number;
  autoScoring: boolean;
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
  position: number;
  weight: number;
};

export type Option = {
  id: string;
  title: string;
  description: string;
  isCorrect?: boolean;
  questionId: string;
  createdAt?: string;
};

export type Folder = {
  id: string;
  folder_name: string;
  created_at?: string;
  user_id: string;
  parent_id?: string;
};
