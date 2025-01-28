import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import GoogleButton from "@/components/GoogleButton";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Login({ searchParams }: { searchParams: Message }) {
  const handleLogin = async () => {};

  return (
    <div className="w-full lg:grid lg:min-h-[100svh] lg:grid-cols-2 xl:min-h-[100svh]">
      <div className="flex items-center justify-center py-12">
        <form className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Iniciar sesión</h1>
            <p className="text-balance text-muted-foreground">
              Ingresa tu correo electrónico y contraseña para iniciar sesión en
              tu cuenta
            </p>
          </div>
          <div className="grid gap-4">
            <FormMessage message={searchParams} />
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                required
              />
            </div>
            <SubmitButton pendingText="Signing In..." formAction={signInAction}>
              Iniciar sesión
            </SubmitButton>
            <GoogleButton />
          </div>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/sign-up" className="underline">
              Regístrate
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
