
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
    <Carousel className="w-full max-w-4xl mx-auto">
      <CarouselContent>
        {images.map((imgSrc, index) => (
          <CarouselItem key={index}>
            <div className="relative aspect-video">
              <Image
                src={imgSrc}
                alt={`${title} - Imagen de galería ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-[-2rem]" />
      <CarouselNext className="right-[-2rem]" />
    </Carousel>
  );
};
