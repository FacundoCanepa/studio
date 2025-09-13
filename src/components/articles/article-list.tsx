'use client';

import { useState } from 'react';
import type { Category } from '@/lib/types';
import { CategoryFilter } from './category-filter';
import { ArticleCard } from './article-card';
import { FadeIn } from '../shared/fade-in';
import { ArticleDoc } from '@/lib/firestore-types';

// Dummy data until Firestore is connected
const articles: ArticleDoc[] = []; 
const categories = [
    { name: 'Moda' },
    { name: 'Estilo de vida' },
    { name: 'Tips' },
    { name: 'Accesorios' },
    { name: 'Temporadas' },
];

export const ArticleList = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const filteredArticles = articles.filter(article => 
    selectedCategory === 'Todos' || article.category?.name === selectedCategory
  );

  return (
    <div>
      <CategoryFilter
        categories={[{ name: 'Todos' }, ...categories].map(c => c.name)}
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
          <p>No hay artículos para mostrar. Conecta tu CMS para empezar.</p>
        </div>
      )}
    </div>
  );
};
