
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResultsSection from "@/components/ResultsSection";
import { Tournament } from "@/lib/types/tournament";

interface ResultsProps {
  tournaments: Tournament[];
}

const Results = ({ tournaments }: ResultsProps) => {
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
    <div className="min-h-screen bg-white overflow-hidden">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 bg-gray-50">
        <div className="section-container py-16">
          <div className="text-center mb-10 reveal">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-black/5 rounded-full mb-4">
              Competición
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-france">Resultados de Torneos</h1>
            <p className="max-w-2xl mx-auto text-gray-600 mb-6">
              Consulta los resultados de nuestros torneos recientes,
              partidas destacadas y clasificaciones.
            </p>
          </div>
        </div>
      </div>
      
      {/* Resultados */}
      <ResultsSection tournaments={tournaments} />
      
      {/* Pie de página */}
      <Footer />
    </div>
  );
};

export default Results;
