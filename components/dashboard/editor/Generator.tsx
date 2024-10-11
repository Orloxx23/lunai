"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  IconBulb,
  IconFile,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react";
import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditor } from "@/context/EditorContext";

export default function Generator() {
  const { generateQuestions, generating } = useEditor();

  const [isOpen, setIsOpen] = useState(false);

  const topicSchema = z.object({
    amount: z.number().int().positive().min(1).max(10),
    context: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  });

  const form = useForm<z.infer<typeof topicSchema>>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      amount: 5,
      context: "",
      difficulty: "medium",
    },
  });

  function onSubmit(values: z.infer<typeof topicSchema>) {
    console.log(values);
    generateQuestions(
      values.amount,
      values.context,
      values.difficulty as "easy" | "medium" | "hard" | "mixed",
      () => {
        form.reset();
        setIsOpen(false);
      }
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={"ghost"} size={"icon"}>
          <IconSparkles size={24} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl" forceMount>
        <AlertDialogHeader className="hidden">
          <AlertDialogTitle>Generar preguntas</AlertDialogTitle>
          <AlertDialogDescription>
            Genera preguntas de forma automática para tu cuestionario en base a
            un documento o tematica.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="w-full flex gap-4">
          <div className="w-3/5 h-full">
            <Tabs defaultValue="topic" className="w-full">
              <TabsList className="w-full aspect-video">
                <TabsTrigger value="topic" className="w-full">
                  <IconBulb size={20} />
                </TabsTrigger>
                <TabsTrigger disabled value="file" className="w-full">
                  <IconFile size={20} />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="topic" className="h-full">
                <div className="flex flex-col gap-4 h-full">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-2 h-full"
                    >
                      <FormField
                        control={form.control}
                        name="context"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tema
                              <FormMessage className="text-xs" />
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Tema de las preguntas"
                                className="resize-none"
                                //maxLength={100}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Cantidad de preguntas
                              <FormMessage className="text-xs" />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder=" Cantidad de preguntas"
                                type="number"
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Dificultad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="easy">Fácil</SelectItem>
                                <SelectItem value="medium">Medio</SelectItem>
                                <SelectItem value="hard">Difícil</SelectItem>
                                <SelectItem value="mixed">Mixto</SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex-1"></div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          disabled={generating}
                          variant={"outline"}
                          type="button"
                          onClick={() => {
                            form.reset();
                            setIsOpen(false);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          disabled={generating || !form.formState.isValid}
                          type="submit"
                          className="w-full"
                        >
                          {generating ? (
                            <IconLoader2 className="animate-spin" />
                          ) : (
                            "Generar"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>
              <TabsContent value="file">Change your password here.</TabsContent>
            </Tabs>
          </div>
          <div className="w-2/5 aspect-[9/16] rounded-lg overflow-hidden relative">
            {/* <Image
              src={"/cave.webp"}
              width={576}
              height={1024}
              alt="Cave"
              className="size-full absolute"
            /> */}
            <PortalEffect />
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PortalEffect() {
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffectRef = useRef<any>(null);

  useEffect(() => {
    const loadVantaEffect = () => {
      if (
        typeof window !== "undefined" &&
        vantaRef.current &&
        (window as any).VANTA
      ) {
        vantaEffectRef.current = (window as any).VANTA.FOG({
          el: vantaRef.current,
          THREE: (window as any).THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0xb400ff,
          midtoneColor: 0x6900ff,
          lowlightColor: 0x370032,
          baseColor: 0xd987d4,
          zoom: 2,
          speed: 2.7
        });
      }
    };

    loadVantaEffect();

    return () => {
      if (vantaEffectRef.current) vantaEffectRef.current.destroy();
    };
  }, []);

  return <div ref={vantaRef} className="size-full relative z-50" />;
}
