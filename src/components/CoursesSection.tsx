import React, { useState, useEffect, useCallback } from 'react'; 
import { Course } from '@/lib/types/courses';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingCart } from 'lucide-react';

interface CoursesSectionProps {
  courses: Course[];
}

const CoursesSection: React.FC<CoursesSectionProps> = ({ courses }) => {
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);

  const toggleExpand = (courseId: string) => {
    setExpandedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const getLevelColor = (level: string | undefined) => {
    if (!level) return "bg-gray-100 text-gray-800";

    switch (level.toLowerCase()) {
      case 'principiante':
        return "bg-green-100 text-green-800";
      case 'intermedio':
        return "bg-blue-100 text-blue-800";
      case 'avanzado':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 mb-12 md:mb-16">
          <div className="text-center mb-4 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-blue-600 mb-2">Cursos Online</h2>
            <p className="text-sm md:text-base text-gray-600">Aprende a tu ritmo.</p>
          </div>
          <div className="hidden md:block w-px bg-gray-200"></div>
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-green-600 mb-2">Clases Presenciales</h2>
            <p className="text-sm md:text-base text-gray-600">Formación personalizada con nuestros maestros</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="bg-white rounded-xl shadow-card hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="aspect-video overflow-hidden">
                <img 
                  src={course.image || '/placeholder.svg'} 
                  alt={course.title} 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>

              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={`text-xs md:text-sm ${getLevelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                  {course.type === 'clase' && course.ageRange && (
                    <Badge variant="outline" className="text-xs md:text-sm">
                      {course.ageRange}
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg md:text-xl font-rubik font-bold mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm md:text-base mb-4 font-lora">{course.description}</p>

                {expandedCourses.includes(course.id) && (
                  <div 
                    className="mt-2 text-gray-700 text-sm md:text-base font-lora"
                    dangerouslySetInnerHTML={{ __html: course.fullDescription }}
                  />
                )}

                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs md:text-sm"
                    onClick={() => toggleExpand(course.id)}
                  >
                    {expandedCourses.includes(course.id) ? 'Ver menos' : 'Leer más'}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs md:text-sm"
                    onClick={() => window.open(course.whatsappLink, '_blank')}
                  >
                    <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Contacto
                  </Button>

                  {course.type === 'curso' && course.mercadoLibreLink && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs md:text-sm"
                      onClick={() => window.open(course.mercadoLibreLink, '_blank')}
                    >
                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      Comprar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;