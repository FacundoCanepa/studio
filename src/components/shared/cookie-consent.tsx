
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'vestigio-cookie-consent';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Solo se ejecuta en el cliente
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consent !== 'true') {
        // Añadir un pequeño retraso para que el banner no sea tan intrusivo al cargar
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('No se pudo acceder a localStorage:', error);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setIsVisible(false);
    } catch (error) {
      console.error('No se pudo guardar el consentimiento en localStorage:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-50 p-4 sm:p-6 w-full sm:max-w-md',
        'transition-transform duration-500 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <Card className="shadow-2xl">
        <CardContent className="p-6">
           <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <CardTitle className="text-lg font-headline">Tu Privacidad es Importante</CardTitle>
                <CardDescription className="mt-2 text-sm text-muted-foreground">
                  Usamos cookies para mejorar tu experiencia en nuestro sitio. Al continuar, aceptas nuestra{' '}
                  <Link href="/politica-de-privacidad" className="underline hover:text-primary">
                    Política de Privacidad
                  </Link>
                  .
                </CardDescription>
              </div>
           </div>
           <Button className="w-full mt-6" onClick={handleAccept}>
            Entendido
           </Button>
        </CardContent>
      </Card>
    </div>
  );
};
