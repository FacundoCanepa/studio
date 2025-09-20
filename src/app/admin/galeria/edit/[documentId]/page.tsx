import * as React from 'react';
import { getGalleryItem } from '@/lib/strapi-client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { GalleryForm } from '../../_components/gallery-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type Props = {
    params: { documentId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getGalleryItem(params.documentId);
  if (!item) {
    return { title: 'Elemento no encontrado' };
  }
  return {
    title: `Editar: ${item.title} - Admin Panel`,
  };
}

export default async function EditGalleryItemPage({ params }: Props) {
  const item = await getGalleryItem(params.documentId);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/galeria">Galería</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold tracking-tight">Editar Elemento de Galería</h1>

      <GalleryForm item={item} />
    </div>
  );
}
