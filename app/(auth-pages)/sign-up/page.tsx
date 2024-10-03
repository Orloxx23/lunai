import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import GoogleButton from "@/components/GoogleButton";
import { SubmitButton } from "@/components/submit-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Signup({ searchParams }: { searchParams: Message }) {
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-[100svh] lg:grid-cols-2 xl:min-h-[100svh]">
      <div className="flex items-center justify-center py-12">
        <form className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-balance text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <div className="grid gap-4">
            <FormMessage message={searchParams} />
            <div className="grid gap-2">
              <Label htmlFor="email">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Your username"
                autoComplete="username"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Confirm Password</Label>
              <Input
                id="password"
                name="confirm-password"
                type="password"
                placeholder="Your password again"
                autoComplete="new-password"
                required
              />
            </div>
            <SubmitButton pendingText="Signing In..." formAction={signUpAction}>
              Sign up
            </SubmitButton>

            <GoogleButton />
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="relative h-full w-full">
          {/* <div className="absolute h-full hidden lg:block w-full bg-gradient-to-r from-background to-transparent z-50"></div> */}
          <Image
            src="/authbg2.png"
            alt="Image"
            width="1456"
            height="816"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
