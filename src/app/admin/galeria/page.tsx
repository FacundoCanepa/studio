import * as React from 'react';
import { getGalleryItems } from '@/lib/strapi-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import Link from 'next/link';
import { GalleryDataTable } from './_components/gallery-data-table';
import { columns } from './_components/columns';

export const metadata: Metadata = {
  title: 'Gestionar Galería - Admin Panel',
};

export const revalidate = 0;

export default async function ManageGalleryPage() {
  const items = await getGalleryItems();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestionar Galería</h1>
        <Button asChild>
          <Link href="/admin/galeria/new">Crear Nuevo Elemento</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Elementos</CardTitle>
          <CardDescription>
            Aquí podrás ver, buscar, editar y eliminar todos los elementos de la galería.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GalleryDataTable columns={columns} data={items} />
        </CardContent>
      </Card>
    </div>
  );
}
