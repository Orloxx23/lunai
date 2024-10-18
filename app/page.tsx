import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Brain, CheckCircle, MessageCircle, Moon, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IconMoon, IconMoonFilled } from "@tabler/icons-react";

export default function LunaiLandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <IconMoonFilled className="h-6 w-6 text-primary" />
          <span className="ml-2 text-2xl font-bold text-primary">Lunai</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#features"
          >
            Características
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#how-it-works"
          >
            Cómo funciona
          </Link>
          {/* <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#pricing"
          >
            Precios
          </Link> */}
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#faq"
          >
            FAQ
          </Link>
        </nav>
      </header>
      <div className="flex-1">
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-primary">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                <div className="flex flex-col justify-center space-y-4 text-white">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                      Crea cuestionarios inteligentes con Lunai
                    </h1>
                    <p className="max-w-[600px] text-gray-200 md:text-xl">
                      Utiliza la inteligencia artificial para generar
                      cuestionarios personalizados y obtén feedback inmediato.
                      Mejora el aprendizaje y la evaluación con Lunai.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Button
                      className="bg-white text-primary hover:bg-gray-100"
                      asChild
                    >
                      <Link href={"/sign-up"}>Comenzar gratis</Link>
                    </Button>
                    {/* <Button variant="outline" className="text-white border-white hover:bg-primary-foreground/10">
                      Ver demo
                    </Button> */}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Image
                    alt="Lunai Dashboard"
                    className="aspect-video overflow-hidden rounded-md object-cover object-center"
                    height="310"
                    src="/preview.webp"
                    width="550"
                  />
                </div>
              </div>
            </div>
          </section>
          <section
            id="features"
            className="w-full py-12 md:py-24 lg:py-32 bg-gray-100"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
                Características principales
              </h2>
              <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <Brain className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>IA Avanzada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Utiliza algoritmos de inteligencia artificial para generar
                    preguntas relevantes y personalizadas.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Zap className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Feedback Instantáneo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Recibe retroalimentación inmediata sobre las respuestas,
                    mejorando el proceso de aprendizaje.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CheckCircle className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Personalización</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Adapta los cuestionarios a las necesidades específicas de
                    cada usuario o grupo.
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
                Cómo funciona
              </h2>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <Image
                    alt="Paso 1: Crea tu cuestionario"
                    className="aspect-video overflow-hidden rounded-xl object-cover object-center mb-4"
                    height="200"
                    src="/bggradient.webp"
                    width="300"
                  />
                  <h3 className="text-xl font-bold mb-2">
                    1. Crea tu cuestionario
                  </h3>
                  <p>
                    Utiliza nuestra interfaz intuitiva para definir el tema y el
                    nivel de dificultad.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Image
                    alt="Paso 2: La IA genera preguntas"
                    className="aspect-video overflow-hidden rounded-xl object-cover object-center mb-4"
                    height="200"
                    src="/bggradient.webp"
                    width="300"
                  />
                  <h3 className="text-xl font-bold mb-2">
                    2. La IA genera preguntas
                  </h3>
                  <p>
                    Nuestros algoritmos crean preguntas relevantes y desafiantes
                    basadas en tus especificaciones.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Image
                    alt="Paso 3: Obtén feedback inmediato"
                    className="aspect-video overflow-hidden rounded-xl object-cover object-center mb-4"
                    height="200"
                    src="/bggradient.webp"
                    width="300"
                  />
                  <h3 className="text-xl font-bold mb-2">
                    3. Obtén feedback inmediato
                  </h3>
                  <p>
                    Recibe explicaciones detalladas y sugerencias de mejora al
                    instante.
                  </p>
                </div>
              </div>
            </div>
          </section>
          {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Lo que dicen nuestros usuarios</h2>
              <div className="grid gap-6 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Image
                          alt={`Avatar ${i}`}
                          className="rounded-full"
                          height="40"
                          src={`/placeholder.svg?height=40&width=40`}
                          width="40"
                        />
                        <div>
                          <CardTitle>Usuario {i}</CardTitle>
                          <p className="text-sm text-gray-500">Estudiante</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      "Lunai ha revolucionado la forma en que estudio. Los cuestionarios personalizados y el feedback
                      inmediato han mejorado significativamente mi comprensión de los temas."
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section> */}
          {/* <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Planes y precios</h2>
              <div className="grid gap-6 lg:grid-cols-3">
                {[
                  { name: "Básico", price: "Gratis", features: ["100 preguntas/mes", "Feedback básico", "1 usuario"] },
                  { name: "Pro", price: "$9.99/mes", features: ["Preguntas ilimitadas", "Feedback avanzado", "5 usuarios"] },
                  { name: "Empresa", price: "Contactar", features: ["Personalización completa", "API access", "Usuarios ilimitados"] },
                ].map((plan) => (
                  <Card key={plan.name}>
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <p className="text-2xl font-bold">{plan.price}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-primary mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section> */}
          <section
            id="faq"
            className="w-full py-12 md:py-24 lg:py-32 bg-gray-100"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
                Preguntas frecuentes
              </h2>
              <Accordion
                type="single"
                collapsible
                className="w-full max-w-3xl mx-auto"
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    ¿Cómo funciona la IA de Lunai?
                  </AccordionTrigger>
                  <AccordionContent>
                    Lunai utiliza algoritmos avanzados de procesamiento de
                    lenguaje natural para generar preguntas relevantes y
                    personalizadas basadas en el tema y nivel de dificultad
                    especificados.
                  </AccordionContent>
                </AccordionItem>
                {/* <AccordionItem value="item-2">
                  <AccordionTrigger>
                    ¿Puedo integrar Lunai con mi LMS existente?
                  </AccordionTrigger>
                  <AccordionContent>
                    Sí, ofrecemos integraciones con los principales sistemas de
                    gestión de aprendizaje (LMS). Contáctanos para más detalles
                    sobre integraciones específicas.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    ¿Qué tipo de soporte ofrecen?
                  </AccordionTrigger>
                  <AccordionContent>
                    Ofrecemos soporte por correo electrónico para todos los
                    usuarios y soporte prioritario por chat en vivo para
                    nuestros clientes Pro y Empresa.
                  </AccordionContent>
                </AccordionItem> */}
              </Accordion>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32 bg-primary">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white mb-6">
                Comienza a crear cuestionarios inteligentes hoy
              </h2>
              <p className="max-w-[600px] text-gray-200 md:text-xl mx-auto mb-8">
                Únete a miles de educadores y estudiantes que ya están mejorando
                su experiencia de aprendizaje con Lunai.
              </p>
              <Button
                className="bg-white text-primary hover:bg-gray-100"
                size="lg"
              >
                <Link href={"/sign-up"}>Prueba Lunai gratis</Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">
          © 2024 Lunai. Todos los derechos reservados.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Términos de servicio
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacidad
          </Link>
        </nav>
      </footer>
    </div>
  );
}
