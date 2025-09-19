
import * as React from 'react';
import { ArticleCard } from '@/components/articles/article-card';
import { HorizontalArticleCard } from '@/components/articles/horizontal-article-card';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import type { ArticleDoc } from '@/lib/firestore-types';
import { RecommendedArticles } from '@/components/shared/recommended-articles';
import { FloatingIconsHero } from '@/components/shared/floating-icons-hero';
import { SectionTitle } from '@/components/shared/section-title';
import { ImageGallery } from '@/components/shared/image-gallery';
import { ColorPaletteSection } from '@/components/shared/color-palette-section';
import { SocialFollow } from '@/components/shared/social-follow';
import { AdSlot } from '@/components/marketing/ad-slot';
import { fetchCachedArticles } from '@/lib/cached-articles';

export default async function HomePage() {
  const [{ articles: latest }, { articles: featured }] = await Promise.all([
    fetchCachedArticles({ pageSize: 4, isNew: true }),
    fetchCachedArticles({ pageSize: 3, featured: true }),
  ]);

  const latestArticles: ArticleDoc[] = latest.slice(0, 4);
  const featuredArticles: ArticleDoc[] = featured.slice(0, 3);
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
          <SectionTitle className="text-white">Destacados</SectionTitle>
          <div className="grid grid-cols-1 gap-12 mt-16">
            {featuredArticles.map((article) => (
              <HorizontalArticleCard key={article.documentId} article={article} />
            ))}
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 my-16">
        <AdSlot className="w-full h-24 max-w-5xl mx-auto" />
      </div>

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
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          <ImageGallery />
        </div>
      </section>

      {/* Color Palettes */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionTitle>Combina y Acertarás</SectionTitle>
        <div className="mt-16">
          <ColorPaletteSection />
        </div>
      </section>

      {/* Social Follow */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionTitle>Síguenos</SectionTitle>
        <div className="mt-16 flex justify-center">
          <SocialFollow />
        </div>
      </section>
    </div>
  );
}
