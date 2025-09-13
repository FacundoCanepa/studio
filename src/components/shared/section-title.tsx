
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
          "relative inline-block bg-background px-4 text-5xl md:text-6xl font-headline uppercase tracking-wider z-10",
          className
        )}
      >
        {children}
      </h2>
      <div className={cn("absolute left-0 right-0 top-1/2 h-px bg-foreground/20", className?.includes('text-white') ? 'bg-white/20' : 'bg-foreground/20' )}></div>
    </div>
  );
};
