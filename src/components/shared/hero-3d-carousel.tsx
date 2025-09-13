
import * as React from 'react';
import Image from 'next/image';

const images = [
  { id: 1, seed: "arch", hint: "architecture building" },
  { id: 2, seed: "watch", hint: "classic watch" },
  { id: 3, seed: "fabric", hint: "wool fabric" },
  { id: 4, seed: "car", hint: "vintage car" },
  { id: 5, seed: "coffee", hint: "espresso coffee" },
  { id: 6, seed: "interior", hint: "minimalist interior" },
  { id: 7, seed: "suit", hint: "tailored suit" },
  { id: 8, seed: "leather", hint: "leather shoes" },
];

export const Hero3DCarousel = () => {
  return (
    <>
      <div className="card-3d">
        {images.map((image) => (
          <div key={image.id} className="card-item">
            <Image
              src={`https://picsum.photos/seed/${image.seed}/120/180`}
              alt={`Vestigio mood image ${image.id}`}
              data-ai-hint={image.hint}
              fill
              className="object-cover"
              sizes="120px"
              priority={image.id <= 3}
            />
          </div>
        ))}
      </div>
      <div className="relative z-20">
        {/* Content can be placed here if needed in the future */}
      </div>
    </>
  );
};
