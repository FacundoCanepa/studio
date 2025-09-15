
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, ShieldCheck, ShieldOff } from 'lucide-react';
import Link from 'next/link';

interface HealthStatus {
  ok: boolean;
  message: string;
  security?: {
    cors: { status: string; origin: string };
    csrf: { cookiePresent: boolean; status: string };
  };
}

export const ProviderCheckStatus = () => {
  const [status, setStatus] = React.useState<HealthStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const frontendUrl = process.env.FRONT_ORIGIN_PROD || 'No configurado';

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/_health/auth');
        if (!res.ok) {
          throw new Error(`La API de salud respondió con estado ${res.status}`);
        }
        const data = await res.json();
        setStatus(data.data);
      } catch (err: any) {
        setError(err.message || 'No se pudo conectar con la API de salud.');
      } finally {
        setLoading(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <Card className="bg-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-6 w-6" />
          Estado Actual del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg bg-background">
          <span className="font-mono text-sm font-medium">NEXT_PUBLIC_STRAPI_URL:</span>
          <Badge variant="secondary">{strapiUrl || 'No configurado'}</Badge>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg bg-background">
          <span className="font-mono text-sm font-medium">FRONT_ORIGIN_PROD:</span>
          <Badge variant="secondary">{frontendUrl}</Badge>
        </div>
        
        <Alert variant={error ? 'destructive' : 'default'}>
           {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (status?.ok ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <ShieldOff className="h-4 w-4 text-destructive" />)}
          <AlertTitle>
            {loading
              ? 'Verificando estado de la API...'
              : error
              ? 'Error de Conexión con la API'
              : 'Estado de la API de Autenticación'}
          </AlertTitle>
          <AlertDescription>
            {loading
              ? 'Realizando una prueba de conexión con el endpoint de salud.'
              : error
              ? `Detalle: ${error}`
              : `La API de autenticación está operativa. CORS y CSRF están siendo gestionados. (Origen detectado: ${status?.security?.cors.origin || 'N/A'})`}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
