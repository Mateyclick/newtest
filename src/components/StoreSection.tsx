
import { Product } from "@/lib/types/product";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreSectionProps {
  products: Product[];
}

export default function StoreSection({ products }: StoreSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-square relative overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-cover w-full h-full transition-transform hover:scale-105"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/placeholder.svg';
              }}
            />
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
              {product.category && (
                <Badge variant="outline" className="ml-2">
                  {product.category}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{product.description}</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-france">
                {product.currency} {product.price.toLocaleString()}
              </span>
              <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                {product.stock > 0 ? `Stock: ${product.stock}` : "Agotado"}
              </Badge>
            </div>
            <Button 
              className="w-full"
              disabled={product.stock === 0}
              onClick={() => window.open(product.mercadolibreUrl, '_blank')}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.stock > 0 ? "Ver en MercadoLibre" : "No Disponible"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
