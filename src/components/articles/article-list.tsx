'use client';

import { ArticleCard } from './article-card';
import { FadeIn } from '../shared/fade-in';
import { ArticleDoc } from '@/lib/firestore-types';
import * as React from 'react';
import { HorizontalArticleCard } from './horizontal-article-card';

interface ArticleListProps {
  articles: ArticleDoc[];
  layout?: 'grid' | 'horizontal';
}

export const ArticleList = ({ articles = [], layout = 'grid' }: ArticleListProps) => {

  if (articles.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16">
        <p>No hay artículos para mostrar.</p>
      </div>
    );
  }

  const CardComponent = layout === 'horizontal' ? HorizontalArticleCard : ArticleCard;

  return (
    <>
      {articles.map((article, index) => (
        article ? (
          <FadeIn key={article.documentId} delay={index * 100}>
            <CardComponent article={article} />
          </FadeIn>
        ) : null
      ))}
    </>
  );
};
