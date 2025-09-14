import Image from 'next/image';
import { getGalleryItems } from '@/lib/strapi-client';

export const ImageGallery = async () => {
  const galleryItems = await getGalleryItems();

  if (!galleryItems || galleryItems.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p>La galería de imágenes se mostrará aquí una vez conectado el CMS.</p>
      </div>
    );
  }

  return (
    <>
      {galleryItems.map((item) => (
        <div key={item.id} className="gallery-item-card">
          <Image
            src={item.imageUrl}
            alt={item.description}
            fill
            className="object-cover object-center transition-all duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="gallery-item-overlay">
            <h4 className="font-headline text-2xl clamp-text-h4">{item.title}</h4>
            <p className="text-sm text-center px-4">{item.description}</p>
          </div>
        </div>
      ))}
    </>
  );
};
