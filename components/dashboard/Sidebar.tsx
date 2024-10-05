"use client";

import { sidebarItems } from "@/lib/constants/menus";
import { IconMoon, IconMoonFilled } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Sidebar() {
  let pathname = usePathname();

  return (
    <div className="hidden lg:w-20 2xl:w-80 bg-primary lg:flex flex-col">
      <div className="h-[9.9vh] pb-1.5 flex items-center">
        {/* <div className="size-full px-4 flex items-center justify-start relative bg-white/10 gap-1">
          <IconMoonFilled size={48} className="text-primary-foreground" />
          <span className="text-5xl font-bold text-primary-foreground">Lunai</span>
        </div> */}
      </div>
      <div className="h-[90vh] flex flex-col gap-2 p-4">
        {sidebarItems.map((item, index) => (
          <Link
            key={index}
            href={item.href ?? ""}
            className={`flex lg:justify-center 2xl:justify-start items-center gap-4 py-4 px-4  text-lg transition-colors duration-300 rounded-md ${
              pathname === item.href
                ? "bg-white text-primary hover:bg-white "
                : "text-primary-foreground hover:bg-white/10"
            }`}
          >
            <span className="">{item.icon}</span>
            <span className="lg:hidden 2xl:block">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
