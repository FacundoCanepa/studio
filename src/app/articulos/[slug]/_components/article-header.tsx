
import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FadeIn } from '@/components/shared/fade-in';

interface ArticleHeaderProps {
  article: ArticleDoc;
}

export const ArticleHeader = ({ article }: ArticleHeaderProps) => {
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;

  return (
    <header className="relative bg-primary/90 text-primary-foreground py-24 pt-40 pb-48">
      <div className="absolute inset-0 overflow-hidden">
        {article.coverUrl && (
          <Image
            src={article.coverUrl}
            alt=""
            fill
            className="object-cover object-center opacity-10 filter blur-sm scale-110"
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/80 to-transparent"></div>
      </div>

      <FadeIn className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {article.category && (
          <Link
            href={`/categoria/${article.category.slug}`}
            className="text-sm font-bold uppercase tracking-widest text-accent hover:text-white transition-colors"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="mt-4 text-4xl md:text-6xl font-headline font-medium text-white text-balance">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-primary-foreground/80 text-balance">
            {article.excerpt}
          </p>
        )}
        <div className="mt-8 flex items-center justify-center gap-6">
          {article.author && (
            <div className="flex items-center gap-3">
              {article.author.avatarUrl && (
                <Image
                  src={article.author.avatarUrl}
                  alt={article.author.name || 'Author'}
                  width={48}
                  height={48}
                  className="rounded-full size-12 object-cover border-2 border-primary-foreground/50"
                />
              )}
              <div className="text-left">
                <p className="font-semibold text-white">
                  Por{' '}
                  <Link href={`/autores/${article.author.documentId}`} className="hover:underline">
                    {article.author.name}
                  </Link>
                </p>
                {publishedDate && (
                  <time dateTime={publishedDate.toISOString()} className="text-sm text-primary-foreground/70">
                    {format(publishedDate, "dd 'de' MMMM, yyyy", { locale: es })}
                  </time>
                )}
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </header>
  );
};
