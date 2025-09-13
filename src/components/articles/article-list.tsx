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

export const ArticleList = ({ articles = [], categories }: ArticleListProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const filteredArticles = articles.filter(article => 
    article && (selectedCategory === 'Todos' || article.category?.name === selectedCategory)
  );
  
  console.log('[UI][ArticleList][ITEMS]', { count: filteredArticles?.length });
  if (filteredArticles.length > 0 && filteredArticles[0]) {
    console.log('[UI][ArticleList][FIRST_ITEM]', { slug: filteredArticles[0].slug, documentId: filteredArticles[0].documentId });
  } else {
    console.log('[UI][ArticleList][FIRST_ITEM]', 'no-first');
  }

  console.log('[ARTICLES][UI][PROPS]', { len: filteredArticles?.length });
  filteredArticles?.forEach((a,i) => {
    if(a) {
      console.log("[ARTICLES][UI][ITEM]", i, { slug: a.slug, documentId: a.documentId, title: a.title });
    }
  });

  const categoryNames = [{ name: 'Todos' }, ...categories].map(c => c.name);
  
  const handleSetSelectedCategory = (category: string) => {
    console.log('[UI][Home][FILTERS]', { currentFilters: { category } });
    setSelectedCategory(category);
  }

  if (articles.length === 0) {
    return (
      <div className="mt-8 text-center text-muted-foreground">
        <p>No hay artículos para mostrar por ahora.</p>
      </div>
    );
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
            article ? (
              <FadeIn key={article.documentId} delay={index * 100}>
                <ArticleCard article={article} />
              </FadeIn>
            ) : null
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
