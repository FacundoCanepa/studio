import * as React from 'react';

interface AnimatedTitleProps {
  children: React.ReactNode;
}

export const AnimatedTitle = ({ children }: AnimatedTitleProps) => {
  return (
    <h2 className="text-5xl md:text-6xl font-headline uppercase tracking-wider animated-gradient-text">
      {children}
    </h2>
  );
};
