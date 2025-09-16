
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gestionar Artículos - Admin Panel',
};

export default function ManageArticlesPage() {
  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Gestionar Artículos</h1>
            <Button asChild>
                <Link href="/admin/articles/new">Crear Nuevo Artículo</Link>
            </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Lista de Artículos</CardTitle>
                <CardDescription>Aquí podrás ver, editar y eliminar todos los artículos del sitio.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">La funcionalidad para listar y gestionar artículos se implementará aquí.</p>
            </CardContent>
        </Card>
    </div>
  );
}
