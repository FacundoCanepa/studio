
import * as React from 'react';
import { getArticles, getCategories, getAuthors, getTag } from "@/lib/strapi-client";
import CategoryClientPage from '../../categoria/[slug]/category-client-page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await getTag(params.slug);

  if (!tag) {
    return {
      title: 'Etiqueta no encontrada',
    };
  }

  return {
    title: `#${tag.name} - Vestigio Magazine`,
    description: `Explora todos los artículos etiquetados como "${tag.name}" en Vestigio Magazine.`,
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = params;
  
  const tag = await getTag(slug);

  if (!tag) {
    notFound();
  }

  const [articles, categories, authors] = await Promise.all([
    getArticles({ tagSlug: slug }),
    getCategories(),
    getAuthors(),
  ]);

  // We don't have a specific category, so we pass null.
  // The client page will handle showing "All categories" or pre-filtering
  return (
    <CategoryClientPage 
      initialArticles={articles}
      allCategories={categories}
      authors={authors}
      category={null}
      tag={tag}
      slug={slug}
      pageType="tag"
    />
  );
}
