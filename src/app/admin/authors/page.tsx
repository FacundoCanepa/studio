
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useAuthorsTable } from '@/hooks/useAuthorsTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function ManageAuthorsPage() {
  const {
    data,
    isLoading,
    error,
    page,
    search,
    pageCount,
    handleSearchChange,
    handlePageChange,
  } = useAuthorsTable({ pageSize: 10 });

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
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al cargar autores</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <AuthorDataTable 
            columns={columns} 
            data={data?.items || []} 
            pageCount={pageCount}
            page={page}
            search={search}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
