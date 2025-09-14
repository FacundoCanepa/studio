
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface ArticleCarouselProps {
  images: string[];
  title: string;
}

export const ArticleCarousel = ({ images, title }: ArticleCarouselProps) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    // [ACCESSIBILITY FIX - /articulos/[slug]]: Add aria-roledescription and labels for screen readers.
    <Carousel 
      className="w-full max-w-4xl mx-auto"
      opts={{
        align: "start",
        loop: true,
      }}
      aria-roledescription="carousel"
      aria-label={`Galería de imágenes para ${title}`}
    >
      <CarouselContent>
        {images.map((imgSrc, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="relative aspect-video">
              <Image
                src={imgSrc}
                alt={`${title} - Imagen de galería ${index + 1}`}
                fill
                className="object-cover rounded-lg"
                // [PERFORMANCE FIX - /articulos/[slug]]: Provide specific sizes for carousel images.
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* [RESPONSIVE FIX - /articulos/[slug]]: Adjust button position for smaller screens to avoid overlap. */}
      <CarouselPrevious className="left-[-1rem] md:left-[-2.5rem]" aria-label="Imagen anterior" />
      <CarouselNext className="right-[-1rem] md:right-[-2.5rem]" aria-label="Siguiente imagen" />
    </Carousel>
  );
};
