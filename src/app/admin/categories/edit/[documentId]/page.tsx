
import * as React from 'react';
import { CATEGORY_HAS_DESCRIPTION_FIELD, getCategory } from '@/lib/strapi-client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CategoryForm } from '../../_components/category-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


type Props = {
    params: { documentId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.documentId);
  if (!category) {
    return { title: 'Categoría no encontrada' };
  }
  return {
    title: `Editar: ${category.name} - Admin Panel`,
  };
}

export default async function EditCategoryPage({ params }: Props) {
  const category = await getCategory(params.documentId);
  
  if (!category) {
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
            <BreadcrumbLink href="/admin/categories">Categorías</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold tracking-tight">Editar Categoría</h1>

      <CategoryForm category={category} showDescriptionField={CATEGORY_HAS_DESCRIPTION_FIELD} />
    </div>
  );
}
