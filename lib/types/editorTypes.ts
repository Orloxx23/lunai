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
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
  authorId?: string;
};

export type Question = {
  id: string;
  title: string;
  description: string;
  options: Option[];
  type: "multiple" | "trufalse" | "open";
};

export type Option = {
  id: string;
  title: string;
  description: string;
  correct: boolean;
};
