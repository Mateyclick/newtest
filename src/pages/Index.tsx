import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageCarousel from "@/components/ImageCarousel";
import { carouselImages } from "@/lib/data/data-ui";
import { Calendar, Trophy, BookOpen, History } from "lucide-react";

const Index = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] pt-16">
        <div className="absolute inset-0 z-0">
          <ImageCarousel images={carouselImages} />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Club de Ajedrez Trebejos
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 opacity-90">
            </p>
            <Link
              to="/calendario"
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-gray-900 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
            >
              Mira el calendario de eventos!
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Descubre el Club Trebejos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Más de 50 años formando ajedrecistas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Historia",
                description: "50 años de tradición ajedrecística",
                icon: History,
                link: "/historia",
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "Calendario",
                description: "Eventos y torneos",
                icon: Calendar,
                link: "/calendario",
                color: "bg-green-50 text-green-600"
              },
              {
                title: "Resultados",
                description: "Torneos y resultados",
                icon: Trophy,
                link: "/resultados",
                color: "bg-yellow-50 text-yellow-600"
              },
              {
                title: "Escuela",
                description: "Clases y cursos",
                icon: BookOpen,
                link: "/cursos",
                color: "bg-purple-50 text-purple-600"
              }
            ].map((feature) => (
              <Link
                key={feature.title}
                to={feature.link}
                className="group p-6 rounded-xl transition-all duration-300 hover:shadow-lg bg-white"
              >
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Actividades Destacadas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre todas las actividades que tenemos para ti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4">Actividades Libres</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Martes y Jueves 18:00hs
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Entrada libre para socios
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Ambiente distendido
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4">Torneos Regulares</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Torneos fide
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                 Amplia biblioteca
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Clases para todas las edades y niveles.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;