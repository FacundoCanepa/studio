
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Gestionar Etiquetas - Admin Panel',
};

export default function ManageTagsPage() {
  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Gestionar Etiquetas</h1>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Lista de Etiquetas</CardTitle>
                <CardDescription>Aquí podrás ver, editar y eliminar todas las etiquetas del sitio.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Próximamente</AlertTitle>
                    <AlertDescription>
                        La funcionalidad para gestionar etiquetas se implementará aquí.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    </div>
  );
}
