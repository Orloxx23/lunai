import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";
import { APP_NAME } from "@/lib/constants/general";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: `${APP_NAME}: El Poder del Conocimiento con Inteligencia Artificial`,
  description: `Descubre ${APP_NAME}, una innovadora plataforma de inteligencia artificial diseñada para iluminar tu camino hacia el conocimiento. Inspirada en la sabiduría de la luna, ${APP_NAME} combina tecnología avanzada con una experiencia intuitiva, ayudándote a explorar nuevas ideas y obtener respuestas claras. Con un enfoque único en el aprendizaje profundo y la conexión de datos, ${APP_NAME} te acompaña en tu viaje hacia la comprensión. ¡Potencia tu curiosidad con ${APP_NAME}!`,
  image: "/og.webp",
  openGraph: {
    title: '¡Descubre "El Poder del Conocimiento con Inteligencia Artificial"!',
    description:
      "Descubre una innovadora plataforma de inteligencia artificial diseñada para iluminar tu camino hacia el conocimiento.",
    type: "website",
    locale: "es_ES",
    url: defaultUrl,
    site_name: APP_NAME,
    images: [
      {
        url: "/og.webp",
        width: 690,
        height: 640,
        alt: "¡Descubre 'El Poder del Conocimiento con Inteligencia Artificial'!",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          {children}
          <Analytics />
          <Toaster richColors position="bottom-center" />
        </Providers>

        <Script
          src="https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.fog.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
