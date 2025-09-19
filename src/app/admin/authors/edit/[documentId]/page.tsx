
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
import type { AuthorDoc } from '@/lib/strapi-authors';

type Props = {
  params: { documentId: string };
};

// Helper function to safely map Strapi data to our AuthorDoc type
function mapStrapiDataToAuthorDoc(strapiData: any): AuthorDoc | null {
    if (!strapiData?.attributes?.documentId) {
        return null;
    }
    const attrs = strapiData.attributes;
    return {
        documentId: attrs.documentId,
        name: attrs.name,
        slug: attrs.slug,
        bio: attrs.bio,
        role: attrs.role,
        avatarUrl: attrs.avatarUrl,
        instagram: attrs.instagram,
        tiktok: attrs.tiktok,
        youtube: attrs.youtube,
        website: attrs.website,
        isActive: attrs.isActive,
        featured: attrs.featured,
        createdAt: attrs.createdAt,
        updatedAt: attrs.updatedAt,
    };
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const authorData = await getAuthor(params.documentId);
  const authorName = authorData?.data?.attributes?.name;

  if (!authorName) {
    return { title: 'Autor no encontrado' };
  }
  return {
    title: `Editar: ${authorName} - Admin Panel`,
  };
}

export default async function EditAuthorPage({ params }: Props) {
  const authorResponse = await getAuthor(params.documentId);
  const author = mapStrapiDataToAuthorDoc(authorResponse?.data);
  
  if (!author) {
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
