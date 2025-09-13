
import * as React from 'react';
import { ArticleCard } from '@/components/articles/article-card';
import { HorizontalArticleCard } from '@/components/articles/horizontal-article-card';
import { getArticles } from '@/lib/strapi-client';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import type { ArticleDoc } from '@/lib/firestore-types';
import { RecommendedArticles } from '@/components/shared/recommended-articles';
import { Hero3DCarousel } from '@/components/shared/hero-3d-carousel';

export default async function HomePage() {
  const latestArticles: ArticleDoc[] = await getArticles({ limit: 4, filters: { isNew: true } });
  const featuredArticles: ArticleDoc[] = await getArticles({ limit: 3, filters: { featured: true } });
  
  return (
    <div className="bg-background">
      {/* Animated Headline Hero */}
      <section className="relative h-96 flex items-center justify-center text-center mb-20 overflow-hidden">
        <Hero3DCarousel>
          <div 
            className="text-7xl md:text-9xl font-extrabold text-white tracking-widest uppercase relative select-none"
            style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.4)'}}
          >
            <h1 className="relative">
              <span 
                className="absolute -top-0.5 left-0 w-full h-full bg-transparent"
                style={{
                  animation: 'glitch 2s infinite linear'
                }}
                aria-hidden="true"
              >
                VESTIGIO
              </span>
              VESTIGIO
              <span 
                className="absolute -top-0.5 left-0 w-full h-full bg-transparent"
                style={{
                  animation: 'glitch 2.05s infinite linear'
                }}
                aria-hidden="true"
              >
                VESTIGIO
              </span>
            </h1>
            <span className="absolute -bottom-4 right-0 text-3xl font-normal normal-case animate-bounce">
              .et
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white animate-blink"></span>
            </span>
          </div>
        </Hero3DCarousel>
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
