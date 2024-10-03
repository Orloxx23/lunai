"use client";

import React from "react";
import { Button } from "./ui/button";
import { createBrowserClient } from "@supabase/ssr";
import GoogleIcon from "./icons/GoogleIcon";

export default function GoogleButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const googleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <Button
      type="button"
      onClick={googleSignIn}
      variant="outline"
      className="w-full flex gap-2"
    >
      <GoogleIcon />
      Login with Google
    </Button>
  );
}
