import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const galleryImageIds = [
  'gallery-1', 'gallery-2', 'gallery-3', 
  'gallery-4', 'gallery-5', 'gallery-6'
];

export const ImageGallery = () => {
  const galleryImages = PlaceHolderImages.filter(p => galleryImageIds.includes(p.id));

  return (
    <div className="columns-2 md:columns-3 gap-4 space-y-4">
      {galleryImages.map((image, index) => (
        <div key={image.id} className="overflow-hidden rounded-lg break-inside-avoid">
          <Image
            src={image.imageUrl}
            alt={image.description}
            width={500}
            height={index % 2 === 0 ? 750 : 600}
            className="w-full h-auto object-cover transition-transform duration-300 ease-in-out hover:scale-105"
            data-ai-hint={image.imageHint}
          />
        </div>
      ))}
    </div>
  );
};
