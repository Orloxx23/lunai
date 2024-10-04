"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import SelectTheme from "../select-theme";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);

  let router = useRouter();

  const getUser = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    console.log("🚀 ~ getUser ~ user:", data);

    if (!error) {
      setUser(data.user);
    }
  };

  const signOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="rounded-md">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>Mi cuenta</span>
            <span className="text-sm text-gray-500">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div>
          <SelectTheme /> 
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
