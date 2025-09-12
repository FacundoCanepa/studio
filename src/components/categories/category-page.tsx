'use client';

import { useState } from 'react';
import { articles } from '@/lib/data';
import type { Category } from '@/lib/types';
import { ArticleCard } from '@/components/articles/article-card';
import { FadeIn } from '@/components/shared/fade-in';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AdSlot } from '@/components/marketing/ad-slot';

interface CategoryPageProps {
  category: Category;
}

export const CategoryPage = ({ category }: CategoryPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const categoryArticles = articles.filter(article => article.category === category);

  const filteredArticles = categoryArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <section className="py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-headline font-medium tracking-tighter uppercase">
          {category}
        </h1>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <div className="mb-8 relative">
            <Input
              type="search"
              placeholder="Buscar en esta categoría..."
              className="h-10 pl-10 w-full sm:w-72"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
            {filteredArticles.map((article, index) => (
              <FadeIn key={article.id} delay={index * 100}>
                <ArticleCard article={article} />
              </FadeIn>
            ))}
             {filteredArticles.length > 3 && (
              <div className="sm:col-span-2">
                <AdSlot className="h-32 mt-8" />
              </div>
            )}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>No se encontraron artículos.</p>
            </div>
          )}
        </div>
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <h3 className="font-headline text-xl tracking-wider text-foreground/70">Publicidad</h3>
            <AdSlot className="h-96" />
            <AdSlot className="h-64 mt-8" />
          </div>
        </aside>
      </div>
    </div>
  );
};
