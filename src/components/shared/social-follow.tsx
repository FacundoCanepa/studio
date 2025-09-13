import * as React from 'react';
import { Instagram, Facebook } from 'lucide-react';
import { TikTokIcon } from '@/components/icons/tiktok-icon';

export const SocialFollow = () => {
  return (
    <div className="social-follow-card">
      <a href="#" className="social-container instagram">
        <Instagram className="social-svg" />
      </a>
      
      <a href="#" className="social-container tiktok">
        <TikTokIcon className="social-svg" />
      </a>
        
      <a href="#" className="social-container facebook">
        <Facebook className="social-svg" />
      </a>
    </div>
  );
};
