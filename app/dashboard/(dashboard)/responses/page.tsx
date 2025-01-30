"use client";

import ReponseCard from "@/components/dashboard/library/ReponsesCard";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/lib/types/editorTypes";
import { createClient } from "@/utils/supabase/client";
import { IconLoader2 } from "@tabler/icons-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export default function ReponsesPage() {
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Referencia al elemento "sensor" para el Intersection Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastResponseElementRef = useRef<HTMLDivElement | null>(null);

  // Función para obtener las respuestas paginadas
  const getQuizzesResponses = async (page: number, pageSize: number = 10) => {
    try {
      const supabase = createClient();
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;

      // Obtener respuestas paginadas
      let { data: quizResponses, error } = await supabase
        .from("quiz_responses")
        .select("*, quizzes(*)")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.error("Error fetching quiz responses: ", error);
        return [];
      }

      if (quizResponses) {
        return quizResponses.map((response: any) => ({
          response,
        }));
      }

      return [];
    } catch (err) {
      console.error("Unexpected error: ", err);
      return [];
    }
  };

  // Cargar respuestas iniciales
  useEffect(() => {
    const loadInitialResponses = async () => {
      setLoading(true);
      const initialResponses = await getQuizzesResponses(page);
      setResponses(initialResponses);
      setLoading(false);
    };

    loadInitialResponses();
  }, []);

  // Función para cargar más respuestas
  const loadMoreResponses = useCallback(async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    const nextPage = page + 1;
    const newResponses = await getQuizzesResponses(nextPage);

    if (newResponses.length === 0) {
      setHasMore(false);
    } else {
      setResponses((prevResponses) => [...prevResponses, ...newResponses]);
      setPage(nextPage);
    }

    setIsFetching(false);
  }, [isFetching, hasMore, page]);

  // Configurar el Intersection Observer
  useEffect(() => {
    if (loading || !hasMore) return;

    // Si ya hay un observer, lo desconectamos
    if (observer.current) observer.current.disconnect();

    // Crear un nuevo observer
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          loadMoreResponses();
        }
      },
      { threshold: 1.0 } // Activar cuando el 100% del elemento esté visible
    );

    // Observar el último elemento de la lista
    if (lastResponseElementRef.current) {
      observer.current.observe(lastResponseElementRef.current);
    }

    // Limpiar el observer cuando el componente se desmonte
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, hasMore, isFetching, loadMoreResponses]);

  return (
    <div className="max-w-7xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 h-auto py-4 ">
      {loading ? (
        Array.from({ length: 15 }).map((_, index) => (
          <div key={index} className="w-full h-64 bg-gray-200 animate-pulse" />
        ))
      ) : responses.length > 0 ? (
        responses.map((response, index) => {
          // Asignar la referencia al último elemento de la lista
          if (index === responses.length - 1) {
            return (
              <div ref={lastResponseElementRef} key={response.response.id}>
                <ReponseCard response={response} quiz={{} as Quiz} />
              </div>
            );
          } else {
            return (
              <ReponseCard
                key={response.response.id}
                response={response}
                quiz={{} as Quiz}
              />
            );
          }
        })
      ) : (
        <p className="text-muted-foreground">No hay respuestas</p>
      )}
      {isFetching && <div className="w-full h-64 bg-gray-200 animate-pulse" />}
      {!hasMore && <></>}
    </div>
  );
}
