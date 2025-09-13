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
    <Link 
      href={`/articulos/${article.slug}`} 
      className="w-full h-full flex flex-col hover:scale-105 transition-transform duration-300 group p-4 bg-card/80 dark:bg-zinc-900 rounded-xl"
    >
      <figure className="overflow-hidden rounded-lg relative mb-2">
        {article.coverUrl ? (
          <Image
            src={article.coverUrl}
            alt={article.title}
            width={400}
            height={225}
            className="object-cover object-center aspect-video"
          />
        ) : (
          <div className="aspect-video bg-muted/50"></div>
        )}
        {article.category && (
          <span
            className="absolute top-2 left-2 px-3 py-1 bg-black/30 backdrop-blur-sm text-xs rounded-full text-white"
          >
            {article.category.name}
          </span>
        )}
      </figure>
      
      <div className="flex-grow flex flex-col">
        <div className="flex-grow">
            {publishedDate && (
              <time dateTime={publishedDate.toISOString()} className="text-xs text-foreground/50">
                {format(publishedDate, "dd MMM yyyy", { locale: es })}
              </time>
            )}

            <p className="text-lg font-headline text-pretty mt-2 text-foreground group-hover:text-primary transition-colors duration-300">
              {article.title}
            </p>

            {article.excerpt && (
              <p className="line-clamp-2 text-sm text-foreground/60 mt-1 group-hover:text-foreground/90 transition-opacity duration-300">
                {article.excerpt}
              </p>
            )}
        </div>
        
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-3">
            {article.author?.avatarUrl && (
              <Image 
                src={article.author.avatarUrl}
                alt={article.author.name || 'Author'}
                width={32}
                height={32}
                className="rounded-full size-8 object-cover"
              />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{article.author?.name}</p>
            </div>
          </div>
          
          <div className="simple-arrow-button">
            <span>Ver más</span>
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>
    </Link>
  );
};
