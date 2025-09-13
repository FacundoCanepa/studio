
import * as React from 'react';
import { ArticleCard } from '@/components/articles/article-card';
import { HorizontalArticleCard } from '@/components/articles/horizontal-article-card';
import { getArticles } from '@/lib/strapi-client';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import type { ArticleDoc } from '@/lib/firestore-types';
import { RecommendedArticles } from '@/components/shared/recommended-articles';
import { FloatingIconsHero } from '@/components/shared/floating-icons-hero';

export default async function HomePage() {
  const latestArticles: ArticleDoc[] = await getArticles({ limit: 4, filters: { isNew: true } });
  const featuredArticles: ArticleDoc[] = await getArticles({ limit: 3, filters: { featured: true } });
  
  return (
    <div className="bg-background">
      {/* Animated Icons Hero */}
      <section className="relative h-96 flex items-center justify-center text-center mb-8 overflow-hidden">
        <FloatingIconsHero />
      </section>

      {/* a. Sección "Lo Último" */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-headline text-center mb-12">Lo Último</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {latestArticles.map((article) => (
            <ArticleCard key={article.documentId} article={article} />
          ))}
        </div>
      </section>

      {/* b. Sección "No Te Pierdas" */}
      <section className="bg-[#556B2F] py-20 text-[#FDFBF5]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-headline text-center mb-12">No Te Pierdas</h2>
          <div className="grid grid-cols-1 gap-12">
            {featuredArticles.map((article) => (
              <HorizontalArticleCard key={article.documentId} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Recomendados */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-headline text-center mb-12">Recomendados para ti</h2>
        <RecommendedArticles />
      </section>

    </div>
  );
}
