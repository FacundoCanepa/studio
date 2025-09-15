
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.86 2.17-5.94 2.17-4.52 0-8.18-3.64-8.18-8.18s3.66-8.18 8.18-8.18c2.55 0 4.22.99 5.2 1.9l2.5-2.5C18.14 2.14 15.48 1 12.48 1 5.83 1 0 6.58 0 13.23s5.83 12.23 12.48 12.23c6.88 0 12.13-4.72 12.13-12.35 0-1.05-.1-1.85-.25-2.65h-12z"/>
    </svg>
)

const FacebookIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
)

interface SocialButtonsProps {
  disabled?: boolean;
}

export const SocialButtons = ({ disabled }: SocialButtonsProps) => {
    const strapiBaseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://graceful-bear-073b8037ba.strapiapp.com';
  
    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        window.location.href = `${strapiBaseUrl}/api/connect/${provider}`;
    }

  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            O continuar con
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={disabled}>
            <GoogleIcon />
            <span className="ml-2">Google</span>
        </Button>
        <Button variant="outline" onClick={() => handleSocialLogin('facebook')} disabled={disabled}>
            <FacebookIcon />
            <span className="ml-2">Facebook</span>
        </Button>
      </div>
    </>
  );
};
