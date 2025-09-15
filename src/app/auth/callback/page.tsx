
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

  // Use a ref to ensure the effect runs only once.
  const processed = React.useRef(false);

  React.useEffect(() => {
    // [DEBUG] Log the full search params on arrival
    console.log('[CALLBACK_PAGE] URL Search Params:', searchParams.toString());

    // Don't run until the auth context has finished its initial load
    if (isAuthContextLoading || processed.current) {
        return;
    }
    processed.current = true;
    
    // 1. Check for errors first. Strapi can send errors in various formats.
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    let errorMessage = null;

    if (errorParam) {
      if (errorDescription) {
        errorMessage = `${errorParam}: ${errorDescription}`;
      } else {
        errorMessage = errorParam;
      }
    } else if (errorDescription) {
      errorMessage = errorDescription;
    }

    if (errorMessage) {
      if (errorMessage.toLowerCase().includes('invalid_client')) {
        errorMessage = "Error de configuración del proveedor (invalid_client). Revisa el Client Secret y las URIs de redirección en la consola del proveedor y en Strapi."
      }
      // [DEBUG] Log the detected error
      console.error('[CALLBACK_PAGE] Error detected from URL:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'Error de Autenticación',
        description: errorMessage,
        variant: 'destructive',
      });
      setTimeout(() => router.replace('/login'), 5000);
      return;
    }

    // 2. If no error, try to find the access token.
    const token = searchParams.get('access_token');
    
    // [DEBUG] Log the extracted token
    console.log('[CALLBACK_PAGE] Extracted access_token:', token);

    if (token) {
      setSessionFromToken(token)
        .then(() => {
          console.log('[CALLBACK_PAGE] Session set successfully. Redirecting to home.');
          toast({ title: "¡Bienvenido!" });
          router.replace('/');
        })
        .catch((err) => {
          console.error('[CALLBACK_PAGE] Error from setSessionFromToken:', err);
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
    
    // 3. If no token and no error, it's a misconfiguration.
    const missingTokenError = 'Token de acceso no encontrado en la respuesta. Asegúrate de que la "URL de redirección del Front-end" en Strapi esté configurada correctamente.';
    console.error('[CALLBACK_PAGE] No token and no error found in URL.');
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
