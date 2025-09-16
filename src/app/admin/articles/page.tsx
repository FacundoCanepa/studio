
import * as React from 'react';
import { getArticles } from '@/lib/strapi-client';
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
import { ArticleDataTable } from './_components/article-data-table';
import { columns } from './_components/columns';

export const metadata: Metadata = {
  title: 'Gestionar Artículos - Admin Panel',
};

// Force dynamic rendering to ensure fresh data on each page load
export const revalidate = 0;

export default async function ManageArticlesPage() {
  // Fetch all articles without any limit for the admin panel
  const articles = await getArticles({ limit: -1 });

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
          <CardDescription>
            Aquí podrás ver, buscar, editar y eliminar todos los artículos del sitio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArticleDataTable columns={columns} data={articles} />
        </CardContent>
      </Card>
    </div>
  );
}
