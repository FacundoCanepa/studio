
import * as React from 'react';
import { Shirt, Watch, Gem, Feather, Glasses, Diamond, Anchor, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = [
  { Icon: Shirt, className: 'top-[10%] left-[15%]', duration: '8s', delay: '0s', z: '-50px', size: 48 },
  { Icon: Watch, className: 'top-[20%] right-[10%]', duration: '12s', delay: '1s', z: '20px', size: 40 },
  { Icon: Gem, className: 'bottom-[15%] left-[25%]', duration: '10s', delay: '3s', z: '80px', size: 36 },
  { Icon: Feather, className: 'bottom-[40%] right-[20%]', duration: '9s', delay: '0.5s', z: '-20px', size: 52 },
  { Icon: Glasses, className: 'top-[50%] left-[5%]', duration: '11s', delay: '2s', z: '120px', size: 44 },
  { Icon: Diamond, className: 'top-[5%] right-[30%]', duration: '13s', delay: '4s', z: '0px', size: 32 },
  { Icon: Anchor, className: 'bottom-[5%] left-[50%]', duration: '7s', delay: '1.5s', z: '50px', size: 48 },
  { Icon: Coffee, className: 'bottom-[10%] right-[5%]', duration: '10s', delay: '2.5s', z: '-80px', size: 40 },
];

export const FloatingIconsHero = () => {
  return (
    <div className="absolute inset-0 w-full h-full transform-style-preserve-3d perspective-1000">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/50 to-background opacity-50"></div>
      {icons.map(({ Icon, className, duration, delay, z, size }, index) => (
        <div
          key={index}
          className={cn('absolute floating-icon opacity-30 dark:opacity-50 text-foreground/50 dark:text-primary/40', className)}
          style={{
            animationDuration: duration,
            animationDelay: delay,
            '--start-z': z,
          } as React.CSSProperties}
        >
          <Icon size={size} strokeWidth={1.5} />
        </div>
      ))}
       <div className="relative z-10 flex items-center justify-center h-full">
         <h1 className="text-6xl md:text-8xl font-headline font-medium tracking-tighter text-primary">
            VESTIGIO
         </h1>
       </div>
    </div>
  );
};
