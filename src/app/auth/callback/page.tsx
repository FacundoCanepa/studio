
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthContext } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSessionFromToken } = React.useContext(AuthContext);
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = searchParams.get('access_token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      console.error('Social login error:', errorParam);
      toast({
        title: 'Error de autenticación',
        description: 'No se pudo completar el inicio de sesión. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
      router.replace('/login');
      return;
    }

    if (token) {
      setSessionFromToken(token)
        .then(() => {
          router.replace('/');
        })
        .catch((err) => {
          setError(err.message || 'Ocurrió un error inesperado.');
          router.replace('/login');
        });
    } else {
        setError('Token de acceso no encontrado.');
        router.replace('/login');
    }
  }, [searchParams, router, setSessionFromToken, toast]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h1 className="text-2xl font-bold text-destructive">Error de Autenticación</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <p className="mt-4 text-sm">Serás redirigido a la página de inicio de sesión.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Autenticando, por favor espera...</p>
    </div>
  );
}
