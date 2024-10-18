import AuthButton from "@/components/header-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { APP_NAME } from "@/lib/constants/general"
import { MoonIcon, StarIcon, BrainCircuitIcon } from "lucide-react"
import Link from "next/link"

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-primary-foreground flex flex-col items-center justify-center p-4">
      
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 text-foreground">{APP_NAME}</h1>
        <p className="text-xl text-foreground max-w-2xl mx-auto">
          Iluminando mentes a través de cuestionarios potenciados por inteligencia artificial
        </p>
      </header>

      <main className="w-full max-w-4xl">
        <section className="text-center mb-12">
          <Link href="/dashboard" className="bg-primary  text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors duration-300">
            Comienza tu viaje
          </Link>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg">
            <MoonIcon className="w-12 h-12 text-primary/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aprendizaje Nocturno</h3>
            <p className="text-center">Explora el conocimiento oculto en cualquier momento</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg">
            <StarIcon className="w-12 h-12 text-primary/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Claridad Celestial</h3>
            <p className="text-center">Obtén respuestas precisas iluminadas por IA</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg">
            <BrainCircuitIcon className="w-12 h-12 text-primary/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sabiduría Adaptativa</h3>
            <p className="text-center">Cuestionarios que evolucionan con tu aprendizaje</p>
          </div>
        </section>
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>&copy; 2024 {APP_NAME}. Todos los derechos reservados.</p>
      </footer>
      
      <AuthButton />
    </div>
  )
}