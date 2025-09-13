import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArticleCardProps {
  article: ArticleDoc;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  if (!article) return null;

  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;

  return (
    <Link href={`/articulos/${article.slug}`} className="stacked-card group">
      <div className="stacked-card-info">
        {article.coverUrl && (
          <div className="relative w-full h-40 mb-4 rounded-md overflow-hidden">
            <Image
              src={article.coverUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        
        <div className="flex flex-col gap-2 px-2">
          {article.category && (
            <p className="font-code text-xs uppercase tracking-widest text-primary group-hover:text-accent transition-colors duration-300">
              {article.category.name}
            </p>
          )}
          <h3 className="font-headline text-xl font-medium leading-tight text-foreground">
            {article.title}
          </h3>
          {publishedDate && (
             <p className="text-xs text-muted-foreground mt-1">
              {format(publishedDate, "d 'de' LLLL 'de' yyyy", { locale: es })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
