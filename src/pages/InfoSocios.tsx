
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trophy, Clock, Library, Gamepad2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function InfoSocios() {
  const benefits = [
    { icon: Clock, text: "Actividades libres 2 veces por semana" },
    { icon: Trophy, text: "Torneos exclusivos para socios" },
    { icon: BookOpen, text: "1 torneo gratuito de cada temporalidad anual (Blitz, Rápido, Estándar)" },
    { icon: Library, text: "Acceso a la biblioteca física de Trebejos" },
    { icon: Gamepad2, text: "Acceso a 'Trebejos Game' con funcionalidades avanzadas: pudiendo crear problemas, desafiar amigos y entrar a juegos de tácticas grupales" },
  ];

  const handleContactClick = () => {
    alert("Redirigir a WhatsApp para inscripción");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block text-sm font-medium text-france mb-2">
              CLUB TREBEJOS
            </span>
            <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
              Beneficios de Ser Socio
            </h1>
            <p className="font-rubik text-lg text-gray-600">
              Únete a nuestra comunidad y disfruta de ventajas exclusivas
            </p>
          </div>

          <div className="grid gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6 flex items-start gap-4">
                  <benefit.icon className="h-6 w-6 text-france shrink-0 mt-1" />
                  <p className="font-rubik text-gray-700">{benefit.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="font-lora text-lg px-8"
              onClick={handleContactClick}
            >
              ¡Hazte Socio Ahora!
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
