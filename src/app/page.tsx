
'use client';

import * as React from 'react';
import { ArticleCard } from '@/components/articles/article-card';
import { HorizontalArticleCard } from '@/components/articles/horizontal-article-card';
import { articles as allArticles } from '@/lib/data'; // Usando datos de muestra
import type { ArticleDoc } from '@/lib/firestore-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import Image from 'next/image';
import { Instagram } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [articles, setArticles] = React.useState<ArticleDoc[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulación de carga de datos
    setTimeout(() => {
      setArticles(allArticles);
      setLoading(false);
    }, 500);
  }, []);

  const latestArticles = articles.slice(0, 4);
  const featuredArticles = articles.slice(4, 7);
  const mostReadArticles = articles.slice(0, 5).map((a, i) => ({ ...a, rank: i + 1 }));

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-96 w-full mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF5]">
      {/* Carrusel Principal - Placeholder */}
      <section className="h-96 bg-gray-200 flex items-center justify-center text-center mb-20">
        <p className="text-gray-500">Aquí irá el Carrusel Principal</p>
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

    </div>
  );
}
