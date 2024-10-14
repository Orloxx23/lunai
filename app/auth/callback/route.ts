import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Obtener la sesión para acceder a los datos del usuario
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (user) {
        const userId = user.id;
        const email = user.email;
        const avatar =
          user.user_metadata?.avatar_url ||
          "https://static.vecteezy.com/system/resources/previews/014/170/492/non_2x/pop-art-style-male-avatar-unique-abstract-vector.jpg";
        const username = user.user_metadata?.full_name || email; // O puedes poner un nombre por defecto

        // Verificar si ya existe una fila en la tabla `users`
        const { data: existingUser, error: userCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .single();

        // Si hay un error que no sea "PGRST116" (registro no encontrado)
        if (userCheckError && userCheckError.code !== "PGRST116") {
          console.error(userCheckError.code + " " + userCheckError.message);
          return NextResponse.redirect(`${origin}/error?message=${userCheckError.message}`);
        }

        // Si el usuario no existe en la tabla `users`, insertarlo
        if (!existingUser) {
          const { error: insertError } = await supabase.from("users").insert([
            {
              id: userId,
              email: email,
              username: username,
              avatar: avatar,
            },
          ]);

          if (insertError) {
            console.error(insertError.code + " " + insertError.message);
            return NextResponse.redirect(`${origin}/error?message=${insertError.message}`);
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/protected`);
}
