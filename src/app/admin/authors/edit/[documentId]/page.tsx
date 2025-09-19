
import * as React from 'react';
import { getAuthor } from '@/lib/strapi-authors';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { AuthorForm } from '../../_components/author-form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type Props = {
  params: { documentId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthor(params.documentId);
  if (!author) {
    return { title: 'Autor no encontrado' };
  }
  return {
    title: `Editar: ${author.name} - Admin Panel`,
  };
}

export default async function EditAuthorPage({ params }: Props) {
  const authorData = await getAuthor(params.documentId);

  if (!authorData || !authorData.data) {
    notFound();
  }

  // Mapeamos los datos de Strapi a la estructura de AuthorDoc
  const author = {
    documentId: authorData.data.documentId,
    name: authorData.data.name,
    slug: authorData.data.slug,
    bio: authorData.data.bio,
    role: authorData.data.role,
    avatarUrl: authorData.data.avatarUrl,
    instagram: authorData.data.instagram,
    tiktok: authorData.data.tiktok,
    youtube: authorData.data.youtube,
    website: authorData.data.website,
    isActive: authorData.data.isActive,
    featured: authorData.data.featured,
    createdAt: authorData.data.createdAt,
    updatedAt: authorData.data.updatedAt,
  };


  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/authors">Autores</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold tracking-tight">Editar Autor</h1>

      <AuthorForm initialData={author} />
    </div>
  );
}
