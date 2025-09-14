'use client';

import { ArticleCard } from './article-card';
import { FadeIn } from '../shared/fade-in';
import { ArticleDoc } from '@/lib/firestore-types';
import * as React from 'react';

interface ArticleListProps {
  articles: ArticleDoc[];
}

export const ArticleList = ({ articles = [] }: ArticleListProps) => {

  if (articles.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16">
        <p>No hay artículos para mostrar con los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <>
      {articles.map((article, index) => (
        article ? (
          <FadeIn key={article.documentId} delay={index * 100}>
            <ArticleCard article={article} />
          </FadeIn>
        ) : null
      ))}
    </>
  );
};
