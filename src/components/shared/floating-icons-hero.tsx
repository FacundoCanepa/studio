
import * as React from 'react';
import { Watch, Feather, Shirt, Scissors, Gem, Sparkles, Palette, Crown, Glasses } from 'lucide-react';

export const FloatingIconsHero = () => {
  const letters = 'VESTIGIO'.split('');
  const icons = [
    { Icon: Watch, className: 'top-[10%] left-[10%] w-8 h-8 animation-delay-[-2s] duration-[8s]' },
    { Icon: Feather, className: 'top-[20%] right-[15%] w-10 h-10 animation-delay-[-4s] duration-[10s]' },
    { Icon: Shirt, className: 'bottom-[15%] left-[20%] w-9 h-9 animation-delay-[-6s] duration-[9s]' },
    { Icon: Scissors, className: 'bottom-[25%] right-[25%] w-7 h-7 animation-delay-[-1s] duration-[11s]' },
    { Icon: Gem, className: 'top-[50%] left-[30%] w-6 h-6 animation-delay-[-5s] duration-[7s]' },
    { Icon: Sparkles, className: 'top-[15%] left-[40%] w-8 h-8 animation-delay-[-8s] duration-[12s]' },
    { Icon: Palette, className: 'bottom-[10%] right-[10%] w-10 h-10 animation-delay-[-3s] duration-[8s]' },
    { Icon: Crown, className: 'top-[5%] right-[35%] w-9 h-9 animation-delay-[-7s] duration-[10s]' },
    { Icon: Glasses, className: 'bottom-[40%] left-[5%] w-11 h-11 animation-delay-[-9s] duration-[9s]' },
  ];

  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        {icons.map(({ Icon, className }, index) => (
          <Icon
            key={index}
            className={`icon-float absolute text-foreground/10 ${className}`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="relative z-10 wrapper-grid">
        {letters.map((letter, index) => (
          <div key={index} className="cube">
            <div className="face face-front">{letter}</div>
            <div className="face face-back"></div>
            <div className="face face-right"></div>
            <div className="face face-left"></div>
            <div className="face face-top"></div>
            <div className="face face-bottom"></div>
          </div>
        ))}
      </div>
    </>
  );
};
