import { EditorProvider } from "@/context/EditorContext";
import React from "react";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorProvider>{children}</EditorProvider>;
}
