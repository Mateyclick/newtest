
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Book, User, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/lib/types/courses"; // Importar el tipo
import CoursesSection from "@/components/CoursesSection";

interface CoursesProps {
  courses: Course[];
}

const Courses = ({ courses }: CoursesProps) => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="section-container py-16">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 rounded-full mb-4">
              Club Trebejos
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">Cursos y Clases de Ajedrez</h1>
            <p className="max-w-2xl mx-auto text-gray-600 mb-6">
              Desde principiantes hasta jugadores avanzados, encuentra el programa perfecto para mejorar tu juego
            </p>
          </div>
        </div>
      </div>

      {/* Cursos */}
      <CoursesSection courses={courses} />
      <Footer />
    </div>
  );
};

export default Courses;
