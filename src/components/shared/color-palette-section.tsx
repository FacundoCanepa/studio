import * as React from 'react';
import { ColorPalette } from './color-palette';

const palettes = [
  { 
    id: 'p1', 
    colors: ['264653', '2A9D8F', 'E9C46A', 'F4A261', 'E76F51'], 
    title: 'Atardecer Costero',
    description: 'Perfecto para un look relajado de fin de semana. Combina el azul marino con tonos tierra y un acento vibrante.'
  },
  { 
    id: 'p2', 
    colors: ['003049', 'd62828', 'f77f00', 'fcbf49', 'eae2b7'], 
    title: 'Contraste Urbano',
    description: 'Una paleta de alto contraste para un estilo moderno. El azul profundo y el rojo se equilibran con neutros cálidos.'
  },
  { 
    id: 'p3', 
    colors: ['ccd5ae', 'e9edc9', 'fefae0', 'faedcd', 'd4a373'], 
    title: 'Tierra Neutra',
    description: 'Tonos suaves y terrosos que evocan calma. Ideal para outfits monocromáticos o para combinar con denim claro.'
  },
];

export const ColorPaletteSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {palettes.map((palette) => (
        <ColorPalette 
          key={palette.id} 
          colors={palette.colors} 
          title={palette.title}
          description={palette.description}
        />
      ))}
    </div>
  );
};
