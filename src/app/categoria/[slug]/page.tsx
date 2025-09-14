import * as React from 'react';
import { getArticles, getCategories, getAuthors, getCategory } from "@/lib/strapi-client";
import CategoryClientPage from './category-client-page';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params;
  const category = await getCategory(slug);

  const previousImages = (await parent).openGraph?.images || []
  const categoryImage = category?.imageUrl ? [category.imageUrl] : [];

  return {
    title: `${category?.name || 'Categoría'} - Vestigio Magazine`,
    description: category?.description || `Explora artículos en la categoría ${category?.name || slug}.`,
    openGraph: {
      images: [...categoryImage, ...previousImages],
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = params;
  
  const [articles, categories, authors, category] = await Promise.all([
    getArticles({ categorySlug: slug }),
    getCategories(),
    getAuthors(),
    getCategory(slug)
  ]);

  return (
    <CategoryClientPage 
      initialArticles={articles}
      allCategories={categories}
      authors={authors}
      category={category}
      slug={slug}
    />
  );
}
