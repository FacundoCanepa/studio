import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';

interface ColorPaletteProps {
  colors: string[];
  saves: number;
}

export const ColorPalette = ({ colors, saves }: ColorPaletteProps) => {
  return (
    <div className="color-palette-container">
      <div className="palette">
        {colors.map((color, index) => (
          <div
            key={index}
            className="color"
            style={{ backgroundColor: `#${color}` }}
          >
            <span>{color.toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div className="stats">
        <span>{saves.toLocaleString()} saves</span>
        <MoreHorizontal size={18} />
      </div>
    </div>
  );
};
