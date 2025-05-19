
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HistorySection from "@/components/HistorySection";
import { Milestone } from "@/lib/types/history";

interface HistoryProps {
  milestones: Milestone[];
}

const History = ({ milestones }: HistoryProps) => {
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
              Nuestra Trayectoria
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-france">Historia del Club</h1>
            <p className="max-w-2xl mx-auto text-gray-600 mb-6">
              Más de 50 años de historia ajedrecística en Uruguay.
              Conoce nuestros orígenes y los hitos más importantes.
            </p>
          </div>
        </div>
      </div>
      
      {/* Historia Timeline */}
      <HistorySection milestones={milestones} />
      
      {/* Pie de página */}
      <Footer />
    </div>
  );
};

export default History;
