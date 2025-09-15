
import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/auth/auth-card';

export const metadata: Metadata = {
  title: 'Email Confirmado',
  description: 'Tu cuenta de Vestigio Magazine ha sido activada.',
};

export default function EmailConfirmedPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh] px-4">
       <AuthCard
            title="¡Email Confirmado!"
            description="Tu cuenta ha sido activada exitosamente."
        >
            <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <p className="text-muted-foreground mb-6">
                    Ya puedes iniciar sesión y disfrutar de todo nuestro contenido.
                </p>
                <Button asChild className="w-full">
                    <Link href="/login">Ir a Iniciar Sesión</Link>
                </Button>
            </div>
       </AuthCard>
    </div>
  );
}
