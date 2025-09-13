import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: ArticleDoc;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  if (!article) return null;

  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;

  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-sm border border-border/20 transition-shadow duration-300 hover:shadow-md">
      <Link href={`/articulos/${article.slug}`} className="block">
        {article.coverUrl && (
          <div className="relative w-full h-48">
            <Image
              src={article.coverUrl}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-5">
          {article.category && (
            <p className="text-sm font-medium text-primary mb-1">
              {article.category.name}
            </p>
          )}
          <h3 className="text-xl font-bold font-headline text-foreground leading-tight">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            {publishedDate && (
              <p className="text-xs text-muted-foreground">
                {format(publishedDate, "d 'de' LLLL 'de' yyyy", { locale: es })}
              </p>
            )}
            <div className="group inline-flex items-center gap-1 text-sm font-medium text-primary">
              Ver más
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
