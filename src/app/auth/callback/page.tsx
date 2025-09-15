
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
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      const errorMessage = errorDescription || 'No se pudo completar el inicio de sesión con el proveedor.';
      console.error('Social login error:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'Error de Autenticación',
        description: 'No se pudo completar el inicio de sesión. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
      setTimeout(() => router.replace('/login'), 3000);
      return;
    }

    if (token) {
      setSessionFromToken(token)
        .then(() => {
          router.replace('/');
        })
        .catch((err) => {
          const friendlyError = err.message || 'Ocurrió un error inesperado al validar la sesión.';
          setError(friendlyError);
          toast({
            title: 'Error de Sesión',
            description: friendlyError,
            variant: 'destructive',
          });
          setTimeout(() => router.replace('/login'), 3000);
        });
    } else if (!error) { // Only set error if no other error has been set
        const missingTokenError = 'Token de acceso no encontrado en la respuesta del proveedor.';
        setError(missingTokenError);
        toast({
            title: 'Error de Autenticación',
            description: missingTokenError,
            variant: 'destructive',
        });
        setTimeout(() => router.replace('/login'), 3000);
    }
  }, [searchParams, router, setSessionFromToken, toast, error]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-2xl font-bold text-destructive">Error de Autenticación</h1>
        <p className="mt-2 text-muted-foreground max-w-md">{error}</p>
        <p className="mt-4 text-sm">Serás redirigido a la página de inicio de sesión en unos segundos.</p>
         <div className="mt-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Verificando tu sesión, por favor espera...</p>
    </div>
  );
}
