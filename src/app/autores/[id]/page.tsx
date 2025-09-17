import * as React from 'react';
import { getAuthor, getArticles } from "@/lib/strapi-client";
import type { Metadata } from 'next';
import Image from 'next/image';
import { ArticleCard } from '@/components/articles/article-card';
import { notFound } from 'next/navigation';
import { SectionTitle } from '@/components/shared/section-title';
import { Badge } from '@/components/ui/badge';
import { AdSlot } from '@/components/marketing/ad-slot';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthor(params.id);

  if (!author) {
    return {
      title: 'Autor no encontrado',
    }
  }

  return {
    title: `${author.name} - Vestigio Magazine`,
    description: `Artículos y biografía de ${author.name}.`,
    openGraph: {
      title: `${author.name} - Vestigio Magazine`,
      description: `Conoce más sobre ${author.name} y sus contribuciones a Vestigio.`,
      images: author.avatarUrl ? [author.avatarUrl] : [],
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthor(params.id);

  if (!author) {
    notFound();
  }

  const allArticles = await getArticles({ cache: 'no-store' });
  const authorArticles = allArticles.filter(article => article.author?.documentId === author.documentId);
  
  const bioFirstParagraph = author.bioBlocks?.[0]?.children?.[0]?.text || 'Biografía no disponible.';

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="text-center mb-16">
          <div className="relative w-40 h-40 mx-auto mb-6">
            {author.avatarUrl && (
                <Image
                    src={author.avatarUrl}
                    alt={author.name}
                    fill
                    className="rounded-full object-cover border-4 border-card shadow-lg"
                    sizes="160px"
                    priority
                />
            )}
          </div>
          <h1 className="text-5xl font-headline font-medium clamp-text-h1">{author.name}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{bioFirstParagraph}</p>
        </header>

        {author.bioBlocks && (
            <section className="max-w-2xl mx-auto mb-16">
                <div className="prose prose-lg dark:prose-invert prose-headings:font-headline prose-headings:text-primary prose-a:text-primary hover:prose-a:underline">
                    {author.bioBlocks.map((block: any, index: number) => {
                        if (block.type === 'paragraph') {
                            return <p key={index}>{block.children.map((child: any) => child.text).join('')}</p>;
                        }
                        return null;
                    })}
                </div>
            </section>
        )}
        
        <div className="my-16">
            <AdSlot className="w-full h-24 max-w-4xl mx-auto" />
        </div>

        <section>
          <SectionTitle>Artículos de {author.name}</SectionTitle>
          {authorArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
              {authorArticles.map((article) => (
                <ArticleCard key={article.documentId} article={article} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-muted-foreground">
              {author.name} aún no ha publicado ningún artículo.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
