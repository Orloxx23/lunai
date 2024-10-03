import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Lunai: El Poder del Conocimiento con Inteligencia Artificial",
  description:
    "Descubre Lunai, una innovadora plataforma de inteligencia artificial diseñada para iluminar tu camino hacia el conocimiento. Inspirada en la sabiduría de la luna, Lunai combina tecnología avanzada con una experiencia intuitiva, ayudándote a explorar nuevas ideas y obtener respuestas claras. Con un enfoque único en el aprendizaje profundo y la conexión de datos, Lunai te acompaña en tu viaje hacia la comprensión. ¡Potencia tu curiosidad con Lunai!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
