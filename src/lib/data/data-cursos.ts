import { Course } from "@/lib/types/courses";

export const courses: Course[] = [
  {
    id: "1",
    title: "Iniciación al Ajedrez con martin ",
    description: "Curso básico para principiantes que quieren aprender los fundamentos del ajedrez",
    level: "Principiante",
    instructor: "martin",
    image: "/images/courses/beginner.jpg",
    duration: "2 meses",
    location: "Sede Central",
    priceInfo: "$2000/mes",
    schedule: "Martes y Jueves 18:00",
    capacity: 15,
    enrolled: 8,
    rating: 4.8,
    reviews: 24,
    category: "Principiantes",
    curriculum: [
      "Movimientos básicos",
      "Reglas especiales",
      "Tácticas elementales",
      "Finales básicos"
    ],
    tags: ["principiantes", "básico", "fundamentos"],
    certificate: true,
    featured: true,
    type: "clase",
    ageRange: "Todas las edades",
    whatsappLink: "https://wa.me/+549XXXXXXXXXX?text=Consulta%20sobre%20curso%20de%20iniciación",
    fullDescription: "Curso completo para todas las personas que quieren iniciarse en el ajedrez. Aprenderán las reglas básicas, movimientos de piezas y conceptos fundamentales del juego de manera divertida y práctica."
  },
  {
    id: "2",
    title: "Defensa Escandinava por Nicolas Casas",
    description: "Curso completo sobre la Defensa Escandinava con instructor fide Nicolás Casas",
    level: "Intermedio",
    instructor: "Nicolás Casas",
    instructor_rating: 2500,
    image: "/images/courses/scandinavian.jpg",
    duration: "1 mes",
    location: "Online",
    priceInfo: "$3500",
    schedule: "Descargable",
    capacity: 999,
    enrolled: 45,
    rating: 4.9,
    reviews: 30,
    category: "Aperturas",
    curriculum: [
      "Fundamentos de la Escandinava",
      "Variantes principales",
      "Planes estratégicos",
      "Análisis de partidas"
    ],
    tags: ["aperturas", "defensa", "intermedio"],
    certificate: true,
    featured: true,
    type: "curso",
    whatsappLink: "https://wa.me/+549XXXXXXXXXX?text=Consulta%20sobre%20curso%20Escandinava",
    mercadoLibreLink: "https://www.mercadolibre.com.ar/curso-escandinava",
    fullDescription: `
    <b>Módulos del Curso:</b><br><br>
    
    <b>1. Introducción a la Defensa Escandinava (20 min de video)</b><br>
    - Filosofía de la apertura: ¿Por qué jugarla? Ventajas y riesgos<br>
    - Estructuras de peones típicas<br>
    <i>PDF 1: Guía de notación algebraica + 5 partidas clásicas (con análisis)</i><br><br>

    <b>2. Línea Principal: 1.e4 d5 2.exd5 Dxd5 (30 min de video)</b><br>
    - Desarrollo óptimo de piezas (Caballo a c6 vs Caballo a f6)<br>
    - Cómo evitar trampas comunes (ej. ataques al centro)<br>
    <i>PDF 2: 10 jugadas críticas memorables en torneos GM</i><br>
    <i>Ejercicios 1-5: Encontrar jugadas clave en posiciones dadas (nivel básico)</i><br><br>

    <b>3. Variantes Específicas (40 min de video dividido)</b><br>
    - Variante del Cambio (3… c6): Cuándo y cómo usarla<br>
    - Variante de Avance (2.e5): Control del centro y planes a largo plazo<br>
    - Otras variantes exóticas: Portuguesa, Islandesa (gambito)<br>
    <i>PDF 3: Árbol de decisiones para elegir variantes (flujograma)</i><br>
    <i>Ejercicios 6-15: Simulaciones de partidas con elección de variantes (nivel intermedio)</i><br><br>

    <b>4. Preparación para el Torneo (30 min de video)</b><br>
    - Cómo estudiar rivales: Detecta sus debilidades en esta apertura<br>
    - Manejo del tiempo y psicología en posiciones complejas<br>
    <i>PDF 4: Kit de supervivencia (10 reglas rápidas para no colapsar)</i>
  `,
   courseDetails: {
      videos: true,
      pdf: true,
      exercises: true
    }
  }
];