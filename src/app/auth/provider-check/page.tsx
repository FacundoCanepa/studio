
import * as React from 'react';
import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CheckCircle, AlertCircle, ExternalLink, HardDriveUpload, Link2, Search } from 'lucide-react';
import { ProviderCheckStatus } from './_components/provider-check-status';

export const metadata: Metadata = {
  title: 'Verificación de Proveedores',
  description: 'Checklist para validar la configuración de social login con Strapi.',
};

const ChecklistItem = ({ children, isChecked }: { children: React.ReactNode; isChecked?: boolean }) => (
  <li className="flex items-start gap-3">
    {isChecked !== undefined ? (
      isChecked ? (
        <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-yellow-500 mt-1 shrink-0" />
      )
    ) : (
      <div className="w-5 shrink-0" />
    )}
    <span className="text-muted-foreground">{children}</span>
  </li>
);

export default function ProviderCheckPage() {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const frontendUrl = process.env.FRONT_ORIGIN_PROD;

  if (!strapiUrl || !frontendUrl) {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
             <header className="text-center mb-10">
                <h1 className="text-4xl font-headline font-bold">Verificación de Proveedores</h1>
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error de Configuración</AlertTitle>
                    <AlertDescription>
                        Las variables de entorno `NEXT_PUBLIC_STRAPI_URL` y `FRONT_ORIGIN_PROD` deben estar definidas para que esta página funcione.
                    </AlertDescription>
                </Alert>
            </header>
        </div>
    )
  }

  const googleRedirectUri = `${strapiUrl}/api/connect/google/callback`;
  const facebookRedirectUri = `${strapiUrl}/api/connect/facebook/callback`;
  const frontendCallbackUrl = `${frontendUrl}/auth/callback`;

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-headline font-bold">Verificación de Proveedores</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Guía para asegurar la correcta configuración de Google y Facebook Login con Strapi.
        </p>
      </header>

      <ProviderCheckStatus />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Google Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDriveUpload className="h-6 w-6" />
              Configuración de Google
            </CardTitle>
            <CardDescription>Pasos para validar el proveedor de Google OAuth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-4 text-sm">
              <ChecklistItem>
                <strong>Client ID (en Strapi):</strong> Asegúrate que el valor termine en <Badge variant="secondary">.apps.googleusercontent.com</Badge>.
              </ChecklistItem>
              <ChecklistItem>
                <strong>Client Secret (en Strapi):</strong> Debe ser el secreto del cliente OAuth, no una API Key. Lo encuentras en <span className="font-mono">Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client IDs</span>.
              </ChecklistItem>
              <ChecklistItem>
                <strong>Authorized redirect URIs (en Google Cloud Console):</strong> Debe contener esta URL exacta:
                <Badge variant="outline" className="ml-2 select-all">{googleRedirectUri}</Badge>
              </ChecklistItem>
              <ChecklistItem>
                <strong>Front-end redirect URL (en Strapi):</strong> El campo "The redirect URL to your front-end app" debe ser:
                <Badge variant="outline" className="ml-2 select-all">{frontendCallbackUrl}</Badge>
              </ChecklistItem>
               <ChecklistItem>
                <strong>Pantalla de Consentimiento:</strong> Debe estar en modo "Producción" o tu email de prueba debe estar en la lista de "Test users".
              </ChecklistItem>
            </ul>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Prueba Esperada</AlertTitle>
              <AlertDescription>
                Al hacer clic, deberías volver a <Badge variant="secondary">/auth/callback?access_token=...</Badge>. Si ves <Badge variant="destructive">?error=invalid_client</Badge>, revisa el Client Secret y las URIs.
              </AlertDescription>
            </Alert>
            <Button className="w-full" asChild>
              <a href={`${strapiUrl}/api/connect/google`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Probar Conexión con Google
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Facebook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDriveUpload className="h-6 w-6" />
              Configuración de Facebook
            </CardTitle>
            <CardDescription>Pasos para validar el proveedor de Facebook Login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-4 text-sm">
              <ChecklistItem>
                <strong>App Domains (en Meta Developers → Settings → Basic):</strong>
                 <div className="flex flex-col gap-1 mt-1">
                    <Badge variant="outline" className="select-all">{new URL(strapiUrl).hostname}</Badge>
                    <Badge variant="outline" className="select-all">{new URL(frontendUrl).hostname}</Badge>
                 </div>
              </ChecklistItem>
               <ChecklistItem>
                <strong>Website (en Meta Developers → Add Platform → Website):</strong> El "Site URL" debe ser:
                <Badge variant="outline" className="ml-2 select-all">{frontendUrl}</Badge>
              </ChecklistItem>
              <ChecklistItem>
                <strong>Valid OAuth Redirect URIs (en Facebook Login → Settings):</strong> Debe contener esta URL exacta:
                <Badge variant="outline" className="ml-2 select-all">{facebookRedirectUri}</Badge>
              </ChecklistItem>
               <ChecklistItem>
                <strong>Front-end redirect URL (en Strapi):</strong> El campo de redirección debe ser:
                <Badge variant="outline" className="ml-2 select-all">{frontendCallbackUrl}</Badge>
              </ChecklistItem>
              <ChecklistItem>
                <strong>Modo de la App:</strong> Si está en modo "Development", tu cuenta de Facebook debe tener un rol asignado en la App de Meta.
              </ChecklistItem>
            </ul>
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Prueba Esperada</AlertTitle>
                <AlertDescription>
                    Si Facebook muestra "No se puede cargar la URL", es casi seguro que falta alguna de las URLs en la configuración de Meta for Developers.
                </AlertDescription>
            </Alert>
            <Button className="w-full" asChild>
              <a href={`${strapiUrl}/api/connect/facebook`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Probar Conexión con Facebook
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6" />
              Diagnóstico Rápido (Qué mirar en la URL)
            </CardTitle>
             <CardDescription>
                Observa la URL de la barra de direcciones después de la redirección para entender el problema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Si ves <span className="font-mono">/auth/callback?error=invalid_client</span></AlertTitle>
                <AlertDescription>
                    El <strong>Client Secret de Google</strong> es incorrecto, o la <strong>Authorized redirect URI</strong> no está en la lista de permitidos en Google Cloud Console.
                </AlertDescription>
             </Alert>
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Si Facebook muestra "No se puede cargar la URL"</AlertTitle>
                <AlertDescription>
                    Falta alguna de estas configuraciones en Meta for Developers: <strong>App Domains</strong>, <strong>Website URL</strong> o <strong>Valid OAuth Redirect URIs</strong>. Revisa los tres.
                </AlertDescription>
             </Alert>
             <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Si vuelves a <span className="font-mono">/auth/callback</span> pero sin token ni error</AlertTitle>
                <AlertDescription>
                    El campo <strong>Front-end redirect URL</strong> en Strapi (dentro del proveedor) está mal configurado o no coincide exactamente con el dominio de tu aplicación.
                </AlertDescription>
             </Alert>
          </CardContent>
       </Card>
    </div>
  );
}
