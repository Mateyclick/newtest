import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CarouselImage as ImageSlide } from "@/lib/types/data-ui";

interface ImageCarouselProps {
  images: ImageSlide[];
  autoplaySpeed?: number;
}

const ImageCarousel = ({ images, autoplaySpeed = 5000 }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const nextIndex = (currentIndex + 1) % images.length;
    if (!loadedImages.has(nextIndex)) {
      const img = new Image();
      img.src = images[nextIndex].src;
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(nextIndex));
      };
    }
  }, [currentIndex, images, loadedImages]);

  useEffect(() => {
    const img = new Image();
    img.src = images[currentIndex].src;
    img.onload = () => {
      setIsLoading(false);
      setLoadedImages(prev => new Set(prev).add(currentIndex));
    };
  }, [currentIndex, images]);

  useEffect(() => {
    const interval = setInterval(goToNext, autoplaySpeed);
    return () => clearInterval(interval);
  }, [goToNext, autoplaySpeed]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
        </div>
      )}

      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={`image-${image.id}`}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent">
                <div className="max-w-7xl mx-auto">
                  <p className="text-lg sm:text-xl md:text-2xl text-white font-medium">
                    {image.caption}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-x-0 bottom-1/2 flex justify-between px-4 transform translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 text-white rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Previous slide</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 text-white rounded-full"
        >
          <ChevronRight className="h-6 w-6" />
          <span className="sr-only">Next slide</span>
        </Button>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={`dot-${index}`}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? "bg-white w-4" 
                : "bg-white/50 hover:bg-white/75"
            }`}
          >
            <span className="sr-only">Go to slide {index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;