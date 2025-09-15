
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
import { CheckCircle, AlertCircle, ExternalLink, HardDriveUpload, Link2 } from 'lucide-react';
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
  const strapiUrl = process.env.STRAPI_URL;
  const frontendUrl = process.env.FRONT_ORIGIN_PROD;

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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Punto Crítico</AlertTitle>
              <AlertDescription>
                Un `Client Secret` incorrecto o una URI de redirección no autorizada causará un error `invalid_client`.
              </AlertDescription>
            </Alert>
            <ul className="space-y-4 text-sm">
              <ChecklistItem>
                <strong>Client ID (en Strapi):</strong> Debe terminar en `.apps.googleusercontent.com`.
              </ChecklistItem>
              <ChecklistItem>
                <strong>Client Secret (en Strapi):</strong> Debe ser el secreto del cliente OAuth, no una API Key.
              </ChecklistItem>
              <ChecklistItem>
                <strong>URI de Redirección Autorizada (en Google Cloud Console):</strong>
                <Badge variant="outline" className="ml-2 select-all">{googleRedirectUri}</Badge>
              </ChecklistItem>
              <ChecklistItem>
                <strong>URL de Redirección del Frontend (en Strapi):</strong>
                <Badge variant="outline" className="ml-2 select-all">{frontendCallbackUrl}</Badge>
              </ChecklistItem>
               <ChecklistItem>
                <strong>Pantalla de Consentimiento:</strong> Debe estar en modo &quot;Producción&quot; o tu email debe estar en la lista de &quot;Test users&quot;.
              </ChecklistItem>
            </ul>
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Punto Crítico</AlertTitle>
              <AlertDescription>
                Un dominio no autorizado en Meta for Developers causará el error &quot;No se puede cargar la URL&quot;.
              </AlertDescription>
            </Alert>
            <ul className="space-y-4 text-sm">
              <ChecklistItem>
                <strong>Dominios de la App (en Meta Developers):</strong>
                 <div className="flex flex-col gap-1 mt-1">
                    <Badge variant="outline" className="select-all">{new URL(strapiUrl!).hostname}</Badge>
                    <Badge variant="outline" className="select-all">{new URL(frontendUrl!).hostname}</Badge>
                 </div>
              </ChecklistItem>
               <ChecklistItem>
                <strong>URL del Sitio Web (en Meta Developers):</strong>
                <Badge variant="outline" className="ml-2 select-all">{frontendUrl}</Badge>
              </ChecklistItem>
              <ChecklistItem>
                <strong>URI de Redirección OAuth Válida (en Meta Developers):</strong>
                <Badge variant="outline" className="ml-2 select-all">{facebookRedirectUri}</Badge>
              </ChecklistItem>
               <ChecklistItem>
                <strong>URL de Redirección del Frontend (en Strapi):</strong>
                <Badge variant="outline" className="ml-2 select-all">{frontendCallbackUrl}</Badge>
              </ChecklistItem>
              <ChecklistItem>
                <strong>Modo de la App:</strong> Si está en &quot;Development&quot;, tu cuenta de FB debe tener un rol en la app.
              </ChecklistItem>
            </ul>
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
              <Link2 className="h-6 w-6" />
              Simular Errores de Callback
            </CardTitle>
             <CardDescription>
                Usa estos enlaces para probar cómo la UI maneja los errores que devuelve el proveedor de social login.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
              <Button variant="destructive" asChild>
                <Link href="/auth/callback?error=invalid_client&error_description=El+secreto+de+cliente+no+es+válido">
                    Simular `invalid_client` (Google)
                </Link>
              </Button>
               <Button variant="destructive" asChild>
                <Link href="/auth/callback?error=access_denied&error_description=El+usuario+denegó+el+acceso">
                    Simular `access_denied`
                </Link>
              </Button>
               <Button variant="destructive" asChild>
                <Link href="/auth/callback?error=config_error&error_description=Error+de+configuración+genérico">
                    Simular Error Genérico
                </Link>
              </Button>
          </CardContent>
       </Card>
    </div>
  );
}
