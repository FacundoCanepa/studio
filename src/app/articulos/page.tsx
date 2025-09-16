
import * as React from 'react';
import { getArticles, getCategories, getAuthors } from "@/lib/strapi-client";
import CategoryClientPage from '../categoria/[slug]/category-client-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Todos los artículos - Vestigio Magazine',
    description: 'Explora todos los artículos, guías y tips sobre moda, estilo de vida y tendencias en Vestigio Magazine.',
}

export default async function ArticlesPage() {
  const [articles, categories, authors] = await Promise.all([
    getArticles({ cache: 'no-store' }),
    getCategories(),
    getAuthors({ cache: 'no-store' }),
  ]);

  return (
    <React.Suspense>
      <CategoryClientPage 
        initialArticles={articles}
        allCategories={categories}
        authors={authors}
        category={null}
        slug="all"
        pageType="all"
      />
    </React.Suspense>
  );
}
