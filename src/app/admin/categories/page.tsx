
import * as React from 'react';
import { getCategories } from '@/lib/strapi-client';
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
import { CategoryDataTable } from './_components/category-data-table';

export const metadata: Metadata = {
  title: 'Gestionar Categorías - Admin Panel',
};

// Force dynamic rendering to ensure fresh data on each page load
export const revalidate = 0;

export default async function ManageCategoriesPage() {
  const categories = await getCategories({ cache: 'no-store' });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestionar Categorías</h1>
        <Button asChild>
          <Link href="/admin/categories/new">Crear Nueva Categoría</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>
            Aquí podrás ver, buscar, editar y eliminar todas las categorías del sitio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryDataTable columns={columns} data={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
