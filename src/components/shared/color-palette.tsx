import * as React from 'react';

interface ColorPaletteProps {
  colors: string[];
  title: string;
  description: string;
}

export const ColorPalette = ({ colors, title, description }: ColorPaletteProps) => {
  return (
    <div className="color-palette-container">
      <div className="color-palette">
        {colors.map((color, index) => (
          <div
            key={index}
            className="palette-color"
            style={{ backgroundColor: `#${color}` }}
          >
            <span>#{color.toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <h4 className="text-xl font-headline mt-4">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1 px-4">{description}</p>
      </div>
    </div>
  );
};
