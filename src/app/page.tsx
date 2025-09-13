'use client';

import * as React from 'react';
import { ArticleList } from '@/components/articles/article-list';
import { getArticles, getCategories, getAuthors } from '@/lib/strapi-client';
import type { ArticleDoc, CategoryDoc, AuthorDoc } from '@/lib/firestore-types';
import { ArticleFilters, Filters } from '@/components/articles/article-filters';
import { Skeleton } from '@/components/ui/skeleton';

const INITIAL_FILTERS: Filters = {
  query: '',
  category: 'all',
  author: 'all',
  tags: [],
  featured: false,
  sort: 'publishedAt:desc',
};

export default function HomePage() {
  const [articles, setArticles] = React.useState<ArticleDoc[]>([]);
  const [categories, setCategories] = React.useState<CategoryDoc[]>([]);
  const [authors, setAuthors] = React.useState<AuthorDoc[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<Filters>(INITIAL_FILTERS);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fetchedArticles, fetchedCategories, fetchedAuthors] = await Promise.all([
          getArticles(),
          getCategories(),
          getAuthors(),
        ]);
        setArticles(fetchedArticles);
        setCategories(fetchedCategories);
        setAuthors(fetchedAuthors);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };
  
  const filteredArticles = React.useMemo(() => {
    let filtered = articles;

    // Filter by query
    if (filters.query) {
      const lowerCaseQuery = filters.query.toLowerCase();
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(lowerCaseQuery) ||
          article.excerpt?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(article => article.category?.slug === filters.category);
    }
    
    // Filter by author
    if (filters.author !== 'all') {
      filtered = filtered.filter(article => article.author?.name === filters.author);
    }
    
    // Filter by tags
    if (filters.tags.length > 0) {
        filtered = filtered.filter(article => 
            filters.tags.every(filterTag => 
                article.tags.some(articleTag => articleTag.name === filterTag)
            )
        );
    }

    // Filter by featured
    if (filters.featured) {
        filtered = filtered.filter(article => article.featured);
    }

    // Sort
    filtered.sort((a, b) => {
        const [key, direction] = filters.sort.split(':');
        const aValue = (a as any)[key] || '';
        const bValue = (b as any)[key] || '';

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return filtered;
  }, [articles, filters]);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="w-full lg:w-80 lg:shrink-0">
            <div className="space-y-6 p-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                </div>
                <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </div>
        </div>
        <div className="md:col-span-3">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                         <Skeleton className="h-4 w-1/4" />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-headline font-medium tracking-tighter uppercase">
            Archivo
            </h1>
            <p className="mt-3 max-w-xl mx-auto text-lg text-foreground/80">
            Explora nuestros artículos. Usa los filtros para encontrar exactamente lo que buscas.
            </p>
        </section>
        
        {loading ? (
            <LoadingSkeleton />
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <ArticleFilters 
                    articles={articles}
                    categories={categories}
                    authors={authors}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
                <main className="lg:col-span-3">
                    <ArticleList articles={filteredArticles} />
                </main>
            </div>
        )}
    </div>
  );
}
