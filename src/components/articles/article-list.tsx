'use client';

import { useState } from 'react';
import { CategoryFilter } from './category-filter';
import { ArticleCard } from './article-card';
import { FadeIn } from '../shared/fade-in';
import { ArticleDoc, CategoryDoc } from '@/lib/firestore-types';

interface ArticleListProps {
  articles: ArticleDoc[];
  categories: CategoryDoc[];
}

export const ArticleList = ({ articles, categories }: ArticleListProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const filteredArticles = articles.filter(article => 
    selectedCategory === 'Todos' || article.category?.name === selectedCategory
  );
  
  console.log('[UI][ArticleList][ITEMS]', { count: filteredArticles?.length });
  console.log('[UI][ArticleList][FIRST_ITEM]', filteredArticles?.[0] ? { slug: filteredArticles[0]?.slug, documentId: filteredArticles[0]?.documentId } : 'no-first');

  console.log('[ARTICLES][UI][PROPS]', { len: filteredArticles?.length });
  filteredArticles?.forEach((a,i) => {
    console.log("[ARTICLES][UI][ITEM]", i, { slug: a.slug, documentId: a.documentId, title: a.title });
  });

  const categoryNames = [{ name: 'Todos' }, ...categories].map(c => c.name);
  
  const handleSetSelectedCategory = (category: string) => {
    console.log('[UI][Home][FILTERS]', { currentFilters: { category } });
    setSelectedCategory(category);
  }

  return (
    <div>
      <CategoryFilter
        categories={categoryNames}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleSetSelectedCategory}
      />
      {filteredArticles.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
          {filteredArticles.map((article, index) => (
            <FadeIn key={article.documentId} delay={index * 100}>
              <ArticleCard article={article} />
            </FadeIn>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground">
          <p>No hay artículos para mostrar en esta categoría.</p>
        </div>
      )}
    </div>
  );
};
