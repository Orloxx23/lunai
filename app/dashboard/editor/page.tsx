import EditorBody from "@/components/dashboard/editor/EditorBody";
import Topbar from "@/components/dashboard/editor/Topbar";
import { APP_NAME } from "@/lib/constants/general";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: `Cuestionario sin título - ${APP_NAME}`,
};

export default function Editor() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-accent">
      <Topbar />
      <div className="w-full min-h-[93vh] bg-accent p-4 pt-[calc(7vh+1rem)]">
        <EditorBody />
      </div>
    </div>
  );
}
