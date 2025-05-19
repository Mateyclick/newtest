
export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Todos los niveles';
  instructor: string;
  image: string;
  duration: string;
  location: string;
  priceInfo: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  rating: number;
  reviews: number;
  category: string;
  curriculum: string[];
  prerequisites?: string[];
  tags: string[];
  certificate: boolean;
  featured: boolean;
  type: 'clase' | 'curso';
  ageRange?: string;
  whatsappLink: string;
  mercadoLibreLink?: string;
  fullDescription: string;
  courseDetails?: {
    videos: boolean;
    pdf: boolean;
    exercises: boolean;
  };
}
