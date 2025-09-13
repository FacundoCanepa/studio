import Image from 'next/image';
import type { ArticleDoc } from '@/lib/firestore-types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

interface ArticleCardProps {
  article: ArticleDoc;
  className?: string;
  imageClassName?: string;
}

export const ArticleCard = ({ article, className, imageClassName }: ArticleCardProps) => {
  const imageUrl = article.coverUrl ?? 'https://picsum.photos/seed/default/600/400';
  const imageHint = article.seo?.metaDescription ?? 'fashion style';

  return (
    <article className={cn("group flex flex-col overflow-hidden", className)}>
      <a href={`/articulos/${article.slug}`} className="contents">
        <div className="relative overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={article.title}
            width={600}
            height={400}
            className={cn("w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105", imageClassName)}
            data-ai-hint={imageHint}
          />
        </div>
        <div className="flex flex-col flex-1 py-4">
          <div className="flex-1">
            {article.category && (
              <Badge variant="secondary" className="mb-2">{article.category.name}</Badge>
            )}
            <h3 className="text-xl font-headline leading-snug group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="mt-3 text-sm text-foreground/70 line-clamp-2">{article.excerpt}</p>
          </div>
          <div className="mt-4 flex items-center text-xs text-foreground/60">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) : 'Fecha no disponible'}
            </span>
          </div>
        </div>
      </a>
    </article>
  );
};
