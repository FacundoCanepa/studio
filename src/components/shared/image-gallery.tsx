import Image from 'next/image';

const galleryImages = [
  { id: 'img1', imageUrl: 'https://picsum.photos/seed/gallery1/500/750', description: 'Look minimalista 1', imageHint: 'minimalist fashion' },
  { id: 'img2', imageUrl: 'https://picsum.photos/seed/gallery2/500/600', description: 'Detalle de reloj', imageHint: 'watch detail' },
  { id: 'img3', imageUrl: 'https://picsum.photos/seed/gallery3/500/750', description: 'Arquitectura moderna', imageHint: 'modern architecture' },
  { id: 'img4', imageUrl: 'https://picsum.photos/seed/gallery4/500/600', description: 'Taza de café', imageHint: 'coffee cup' },
  { id: 'img5', imageUrl: 'https://picsum.photos/seed/gallery5/500/750', description: 'Interior de diseño', imageHint: 'design interior' },
  { id: 'img6', imageUrl: 'https://picsum.photos/seed/gallery6/500/600', description: 'Zapatos de cuero', imageHint: 'leather shoes' },
];

export const ImageGallery = () => {
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
        <div key={image.id} className="overflow-hidden rounded-lg break-inside-avoid gallery-card">
          <Image
            src={image.imageUrl}
            alt={image.description}
            width={500}
            height={index % 2 === 0 ? 750 : 600}
            className="w-full h-auto object-cover transition-transform duration-300 ease-in-out"
            data-ai-hint={image.imageHint}
          />
        </div>
      ))}
    </div>
  );
};
