
import * as React from 'react';
import { getArticleBySlug, getArticles } from '@/lib/strapi-client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { ArticleHeader } from './_components/article-header';
import { ArticleBody } from './_components/article-body';
import { ArticleTags } from './_components/article-tags';
import { ShareButtons } from './_components/share-buttons';
import { ArticleList } from '@/components/articles/article-list';
import { SectionTitle } from '@/components/shared/section-title';
import { AdSlot } from '@/components/marketing/ad-slot';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Artículo no encontrado',
    };
  }

  const seo = article.seo || {};
  const ogImage = seo.ogImageUrl || article.coverUrl;

  return {
    title: seo.metaTitle || article.title,
    description: seo.metaDescription || article.excerpt,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    openGraph: {
      title: seo.metaTitle || article.title,
      description: seo.metaDescription || article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : [],
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.metaTitle || article.title,
      description: seo.metaDescription || article.excerpt,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getArticles({
    categorySlug: article.category?.slug,
    limit: 3,
  });
  
  const filteredRelated = relatedArticles.filter(a => a.documentId !== article.documentId);

  return (
    <article className="bg-background">
      <ArticleHeader article={article} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-[-8rem] relative z-10">
        <div className="bg-card shadow-xl rounded-lg overflow-hidden">
          {article.coverUrl && (
            <div className="relative h-64 md:h-96 lg:h-[32rem]">
              <Image
                src={article.coverUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          
          <div className="p-4 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              <aside className="lg:col-span-3 lg:order-last">
                 <div className="sticky top-24 space-y-8">
                    <ShareButtons article={article} />
                    <AdSlot className="w-full h-64" />
                 </div>
              </aside>

              <div className="lg:col-span-9">
                <ArticleBody content={article.contentHtml} />
                
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-12">
                    <ArticleTags tags={article.tags} />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {filteredRelated.length > 0 && (
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle>También te puede interesar</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <ArticleList articles={filteredRelated} />
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
