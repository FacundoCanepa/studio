
import * as React from 'react';
import { getArticleBySlug } from '@/lib/strapi-client';
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
import { ArticleCarousel } from './_components/article-carousel';
import { YouTubeEmbed } from './_components/youtube-embed';
import { FavoriteButton } from './_components/favorite-button';
import { fetchCachedArticles } from '@/lib/cached-articles';
import { CommentSection } from './_components/comment-section';
import { Separator } from '@/components/ui/separator';

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

  const { articles: relatedArticles } = await fetchCachedArticles({
    category: article.category?.slug,
    pageSize: 3,
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
                sizes="(min-width: 1280px) 1200px, (min-width: 768px) 90vw, 100vw"
              />
            </div>
          )}
          
          <div className="p-4 md:p-8 lg:p-12">

            {article.informacion && (
                <div className="bg-secondary/50 p-6 rounded-lg mb-12 border-l-4 border-primary">
                    <p className="text-lg italic text-foreground/80">{article.informacion}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              <aside className="lg:col-span-3 lg:order-last">
                 <div className="sticky top-24 space-y-8">
                    <FavoriteButton articleId={article.id} />
                    <ShareButtons article={article} />
                    <AdSlot className="w-full h-64" />
                 </div>
              </aside>

              <div className="lg:col-span-9">
                <ArticleBody content={article.contentHtml} />
                
                {article.urlYoutube && (
                    <div className="my-12">
                        <YouTubeEmbed url={article.urlYoutube} />
                    </div>
                )}

                {article.carousel && article.carousel.length > 0 && (
                  <div className="my-12">
                    <ArticleCarousel images={article.carousel} title={article.title} />
                  </div>
                )}

                {article.contentMore && (
                    <div className="mt-12 border-t pt-8">
                         <h3 className="font-headline text-2xl mb-4">{article.contentMore}</h3>
                        {/* Here you could parse more markdown if `contentMore` was rich text */}
                    </div>
                )}
                
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-12">
                    <ArticleTags tags={article.tags} />
                  </div>
                )}

                <Separator className="my-16" />

                <CommentSection articleId={article.id} documentId={article.documentId} />

              </div>

            </div>
          </div>
        </div>
      </div>
      
      {filteredRelated.length > 0 && (
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle>También te puede interesar</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                <ArticleList articles={filteredRelated} />
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
