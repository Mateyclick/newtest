
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoreSection from "@/components/StoreSection";
import { Product } from "@/lib/types/product";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('https://sheetdb.io/api/v1/349noqnzwop2z');
  if (!response.ok) throw new Error('Error al cargar productos');
  
  const data = await response.json();
  return data.map((item: any): Product => ({
    id: Number(item.ID) || item.ID,
    name: item.Name,
    description: item.Description,
    imageUrl: item.ImageURL,
    price: Number(item.Price) || 0,
    currency: item.Currency,
    mercadolibreUrl: item.MercadoLibreURL,
    stock: Number(item.Stock) || 0,
    category: item.Category,
    tags: item.Tags?.split(',').map((tag: string) => tag.trim()) || [],
    featured: item.Featured?.toLowerCase() === 'true'
  }));
}

export default function Store() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const uniqueCategories = useMemo(() => {
    if (!products) return [];
    const categories = products.map(p => p.category).filter((c): c is string => !!c);
    return Array.from(new Set(categories));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategory) return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="pt-28 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-900/10 text-blue-900 rounded-full mb-4">
                Productos Oficiales
              </span>
              <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-blue-900">
                Tienda del Club
              </h1>
              <p className="max-w-2xl mx-auto text-blue-800/80">
                Descubre nuestra selección de productos oficiales del Club Trebejos
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {uniqueCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <section className="py-10 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading && (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-blue-600">Cargando productos...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center py-10 text-red-600">
                <p className="font-semibold">Error al cargar los productos</p>
                <p className="text-sm">{(error as Error).message}</p>
              </div>
            )}

            {filteredProducts.length === 0 && selectedCategory && (
              <div className="text-center py-10">
                <p className="text-gray-600">
                  No hay productos en la categoría '{selectedCategory}'
                </p>
              </div>
            )}

            {filteredProducts.length > 0 && <StoreSection products={filteredProducts} />}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
