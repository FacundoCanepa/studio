
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthContext } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSessionFromToken, isLoading: isAuthContextLoading } = React.useContext(AuthContext);
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  
  const processed = React.useRef(false);

  React.useEffect(() => {
    if (processed.current || isAuthContextLoading) {
      return;
    }
    processed.current = true;

    const accessToken = searchParams.get('access_token');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam || errorDescription) {
      const message = errorDescription || errorParam || "Error desconocido del proveedor.";
      setError(message);
      toast({
        title: 'Error de Autenticación',
        description: message,
        variant: 'destructive',
      });
      setTimeout(() => router.replace('/login'), 5000);
      return;
    }

    if (accessToken) {
      setSessionFromToken(accessToken)
        .then(() => {
          toast({ title: "¡Bienvenido!" });
          router.replace('/');
          router.refresh();
        })
        .catch((err) => {
          const friendlyError = err.message || 'Ocurrió un error al validar la sesión.';
          setError(friendlyError);
          toast({
            title: 'Error de Sesión',
            description: friendlyError,
            variant: 'destructive',
          });
          setTimeout(() => router.replace('/login'), 5000);
        });
      return;
    }

    const missingTokenError = 'Token de acceso no encontrado en la respuesta.';
    setError(missingTokenError);
     toast({
        title: 'Error de Configuración',
        description: missingTokenError,
        variant: 'destructive',
    });
    setTimeout(() => router.replace('/login'), 5000);

  }, [searchParams, router, setSessionFromToken, toast, isAuthContextLoading]);

  if (error) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error de Autenticación</h1>
        <p className="mt-2 text-muted-foreground max-w-md bg-destructive/10 p-4 rounded-md">{error}</p>
        <p className="mt-6 text-sm">Serás redirigido a la página de inicio de sesión en unos segundos.</p>
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
