'use client';

import * as React from 'react';
import { ArticleList } from '@/components/articles/article-list';
import { ArticleFilters, Filters } from '@/components/articles/article-filters';
import type { ArticleDoc, CategoryDoc, AuthorDoc } from '@/lib/firestore-types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { AdSlot } from '@/components/marketing/ad-slot';
import { FadeIn } from '@/components/shared/fade-in';

const INITIAL_FILTERS: Filters = {
  query: '',
  category: 'all',
  author: 'all',
  tags: [],
  featured: false,
  sort: 'publishedAt:desc',
};

interface CategoryClientPageProps {
  initialArticles: ArticleDoc[];
  allCategories: CategoryDoc[];
  authors: AuthorDoc[];
  category: CategoryDoc | null;
  slug: string;
}

export default function CategoryClientPage({
  initialArticles,
  allCategories,
  authors,
  category,
  slug,
}: CategoryClientPageProps) {
  const [articles, setArticles] = React.useState<ArticleDoc[]>(initialArticles);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<Filters>({
    ...INITIAL_FILTERS,
    category: slug,
  });

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({ ...INITIAL_FILTERS, category: slug });
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
  
  const heroImage = category?.imageUrl || articles[0]?.coverUrl;
  const articlesWithAds = React.useMemo(() => {
    const adFrequency = 4;
    const components: React.ReactNode[] = [];
    filteredArticles.forEach((article, index) => {
      components.push(
          <ArticleList key={article.documentId} articles={[article]} />
      );
      if ((index + 1) % adFrequency === 0 && index < filteredArticles.length -1) {
        components.push(
          <FadeIn key={`ad-${index}`} delay={100} className="sm:col-span-2">
            <AdSlot className="w-full h-32" />
          </FadeIn>
        );
      }
    });
    return components;
  }, [filteredArticles]);

  return (
    <div>
        <section className="relative text-center py-20 md:py-32 min-h-[40vh] flex items-center justify-center text-white overflow-hidden">
            {heroImage ? (
                <Image
                    src={heroImage}
                    alt={`Fondo de la categoría ${category?.name}`}
                    fill
                    className="object-cover object-center"
                    priority
                    sizes="100vw"
                />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent"></div>
            )}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div className="relative z-10 p-4">
                <h1 className="text-5xl md:text-7xl font-headline font-medium tracking-tighter uppercase clamp-text-h1">
                    {category?.name || 'Categoría'}
                </h1>
                {category?.description && (
                    <p className="mt-3 max-w-xl mx-auto text-lg text-white/80">
                        {category.description}
                    </p>
                )}
            </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {loading ? (
                <LoadingSkeleton />
            ) : (
                <div className="flex flex-col lg:flex-row lg:gap-12">
                    <ArticleFilters 
                        articles={initialArticles}
                        categories={allCategories}
                        authors={authors}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                    <main className="flex-1 mt-12 lg:mt-0">
                         {articlesWithAds.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
                                {articlesWithAds}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <p>No hay artículos para mostrar con los filtros seleccionados.</p>
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    </div>
  );
}
