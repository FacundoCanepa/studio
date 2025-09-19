
import * as React from 'react';
import { listAuthors } from '@/lib/strapi-authors';
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
import { columns } from './_components/columns';
import { AuthorDataTable } from './_components/author-data-table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'Gestionar Autores - Admin Panel',
};

// Force dynamic rendering to ensure fresh data on each page load
export const revalidate = 0;

export default async function ManageAuthorsPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const query = searchParams?.query || '';
  
  const { data: authors, meta } = await listAuthors({ page: currentPage, search: query, pageSize: 10 });
  const pageCount = meta.pagination?.pageCount || 1;

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Autores</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestionar Autores</h1>
        <Button asChild>
          <Link href="/admin/authors/new">Crear Nuevo Autor</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Autores</CardTitle>
          <CardDescription>
            Aquí podrás ver, buscar, editar y eliminar todos los autores del sitio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthorDataTable columns={columns} data={authors} pageCount={pageCount} />
        </CardContent>
      </Card>
    </div>
  );
}
