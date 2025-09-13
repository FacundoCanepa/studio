import * as React from 'react';
import { ColorPalette } from './color-palette';

const palettes = [
  { id: 'p1', colors: ['264653', '2A9D8F', 'E9C46A', 'F4A261', 'E76F51'], saves: 53421 },
  { id: 'p2', colors: ['003049', 'd62828', 'f77f00', 'fcbf49', 'eae2b7'], saves: 48123 },
  { id: 'p3', colors: ['ccd5ae', 'e9edc9', 'fefae0', 'faedcd', 'd4a373'], saves: 31098 },
];

export const ColorPaletteSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {palettes.map((palette) => (
        <ColorPalette key={palette.id} colors={palette.colors} saves={palette.saves} />
      ))}
    </div>
  );
};
