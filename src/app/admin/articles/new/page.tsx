

import * as React from 'react';
import { getAuthors, getCategories, getTags } from '@/lib/strapi-client';
import { Metadata } from 'next';
import { ArticleForm } from '../_components/article-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'Crear Nuevo Artículo - Admin Panel',
};

export default async function NewArticlePage() {
  const [authors, categories, allTags] = await Promise.all([
      getAuthors(), 
      getCategories(),
      getTags()
    ]);

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/articles">Artículos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Crear Nuevo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Artículo</h1>

      <ArticleForm
        authors={authors}
        categories={categories}
        allTags={allTags}
        article={null}
      />
    </div>
  );
}
