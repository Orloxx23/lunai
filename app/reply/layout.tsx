import { ReplyProvider } from "@/context/ReplyContext";
import React from "react";

export default function ReplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReplyProvider>{children}</ReplyProvider>;
}
