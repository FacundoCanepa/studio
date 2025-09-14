
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
}

export const SectionTitle = ({ children, className }: SectionTitleProps) => {
  return (
    <div className="relative text-center">
      <h2
        className={cn(
          "relative inline-block bg-transparent px-4 font-headline uppercase tracking-wider z-10 clamp-text-h2",
          className
        )}
      >
        {children}
      </h2>
       <div
        className={cn(
          "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px z-0",
          className?.includes('text-white') ? 'bg-white/20' : 'bg-foreground/10'
        )}
      />
    </div>
  );
};
