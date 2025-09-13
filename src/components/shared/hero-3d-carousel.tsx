
import * as React from 'react';

export const Hero3DCarousel = () => {
  const word = "VESTIGIO";
  const letters = word.split('');

  return (
    <>
      <div className="card-3d">
        {letters.map((letter, i) => (
          <div key={i} className="card-item">
            {letter}
          </div>
        ))}
      </div>
      <div className="relative z-20">
        {/* Content can be placed here if needed in the future */}
      </div>
    </>
  );
};
