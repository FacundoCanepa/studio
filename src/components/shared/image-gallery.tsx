import Image from 'next/image';

export const ImageGallery = () => {
  // Dummy data, will be replaced by Strapi data
  const galleryImages: any[] = [];

  if (galleryImages.length === 0) {
    return (
        <div className="text-center text-muted-foreground">
            <p>La galería de imágenes se mostrará aquí una vez conectado el CMS.</p>
        </div>
    );
  }

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
