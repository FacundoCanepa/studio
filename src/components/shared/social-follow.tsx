import * as React from 'react';
import { Instagram, Facebook, PenSquare } from 'lucide-react';

export const SocialFollow = () => {
  return (
    <div className="social-follow-card">
      <a href="#" className="social-container instagram">
        <Instagram className="social-svg" />
      </a>
      
      <a href="#" className="social-container pinterest">
        <PenSquare className="social-svg" />
      </a>
        
      <a href="#" className="social-container facebook">
        <Facebook className="social-svg" />
      </a>
    </div>
  );
};
