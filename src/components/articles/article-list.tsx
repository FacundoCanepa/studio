'use client';

import { ArticleCard } from './article-card';
import { FadeIn } from '../shared/fade-in';
import { ArticleDoc } from '@/lib/firestore-types';

interface ArticleListProps {
  articles: ArticleDoc[];
}

export const ArticleList = ({ articles = [] }: ArticleListProps) => {
  console.log('[UI][ArticleList][ITEMS]', { count: articles?.length });
  if (articles.length > 0 && articles[0]) {
    console.log('[UI][ArticleList][FIRST_ITEM]', { slug: articles[0].slug, documentId: articles[0].documentId });
  } else {
    console.log('[UI][ArticleList][FIRST_ITEM]', 'no-first');
  }

  console.log('[ARTICLES][UI][PROPS]', { len: articles?.length });
  articles?.forEach((a,i) => {
    if(a) {
      console.log("[ARTICLES][UI][ITEM]", i, { slug: a.slug, documentId: a.documentId, title: a.title });
    }
  });


  if (articles.length === 0) {
    return (
      <div className="mt-8 text-center text-muted-foreground">
        <p>No hay artículos para mostrar por ahora.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
      {articles.map((article, index) => (
        article ? (
          <FadeIn key={article.documentId} delay={index * 100}>
            <ArticleCard article={article} />
          </FadeIn>
        ) : null
      ))}
    </div>
  );
};
