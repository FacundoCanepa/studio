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

  const categoryNames = [{ name: 'Todos' }, ...categories].map(c => c.name);

  return (
    <div>
      <CategoryFilter
        categories={categoryNames}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
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
