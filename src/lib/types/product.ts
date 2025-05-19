
export interface Product {
  id: string | number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  mercadolibreUrl: string;
  stock: number;
  category?: 'Indumentaria' | 'Accesorios' | 'Libros' | 'Juegos' | 'Otros';
  tags?: string[];
  featured?: boolean;
}
