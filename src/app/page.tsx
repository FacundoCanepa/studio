
import * as React from 'react';
import { ArticleCard } from '@/components/articles/article-card';
import { HorizontalArticleCard } from '@/components/articles/horizontal-article-card';
import { getArticles } from '@/lib/strapi-client';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import type { ArticleDoc } from '@/lib/firestore-types';
import { RecommendedArticles } from '@/components/shared/recommended-articles';
import { FloatingIconsHero } from '@/components/shared/floating-icons-hero';
import { SectionTitle } from '@/components/shared/section-title';
import { ImageGallery } from '@/components/shared/image-gallery';

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
        <SectionTitle className="animated-gradient-text">Lo Último</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {latestArticles.map((article) => (
            <ArticleCard key={article.documentId} article={article} />
          ))}
        </div>
      </section>

      {/* b. Sección "Destacados" */}
      <section className="bg-primary/90 py-20 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle className="text-white before:bg-white/20">Destacados</SectionTitle>
          <div className="grid grid-cols-1 gap-12 mt-16">
            {featuredArticles.map((article) => (
              <HorizontalArticleCard key={article.documentId} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Recomendados */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionTitle>Recomendados para ti</SectionTitle>
        <div className="mt-16">
          <RecommendedArticles />
        </div>
      </section>

      {/* Image Gallery */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionTitle>Galería</SectionTitle>
        <div className="mt-16 gallery-container">
          <ImageGallery />
        </div>
      </section>
    </div>
  );
}
