
import * as React from 'react';
import { getArticle, getAuthors, getCategories } from '@/lib/strapi-client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArticleForm } from '../../_components/article-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


type Props = {
    params: { documentId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  console.log(`[METADATA_EDIT_PAGE] Fetching article for documentId: ${params.documentId}`);
  const article = await getArticle(params.documentId);
  if (!article) {
    console.log(`[METADATA_EDIT_PAGE] Article not found for documentId: ${params.documentId}`);
    return { title: 'Artículo no encontrado' };
  }
  console.log(`[METADATA_EDIT_PAGE] Article found: "${article.title}"`);
  return {
    title: `Editar: ${article.title} - Admin Panel`,
  };
}

export default async function EditArticlePage({ params }: Props) {
  console.log(`[EDIT_ARTICLE_PAGE] Rendering for article documentId: ${params.documentId}`);
  
  const [article, authors, categories] = await Promise.all([
    getArticle(params.documentId),
    getAuthors(),
    getCategories(),
  ]);

  if (!article) {
    console.error(`[EDIT_ARTICLE_PAGE] Article with documentId ${params.documentId} not found. Triggering 404.`);
    notFound();
  }

  console.log(`[EDIT_ARTICLE_PAGE] Successfully fetched data for article "${article.title}"`);
  console.log(`[EDIT_ARTICLE_PAGE] Fetched ${authors.length} authors and ${categories.length} categories.`);

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
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold tracking-tight">Editar Artículo</h1>

      <ArticleForm
        article={article}
        authors={authors}
        categories={categories}
      />
    </div>
  );
}
