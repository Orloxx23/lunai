import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <div className="flex flex-col w-full h-screen ">
        <Topbar />
        <div className="size-full px-4 py-4 bg-accent overflow-y-auto ">{children}</div>
      </div>
    </div>
  );
}
