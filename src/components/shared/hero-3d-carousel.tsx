
import * as React from 'react';

export const Hero3DCarousel = ({ children }: { children?: React.ReactNode }) => {
  return (
    <>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10" />
      <div className="card-3d">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="card-item" />
        ))}
      </div>
      <div className="relative z-20">
        {children}
      </div>
    </>
  );
};
