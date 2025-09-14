
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
      className="w-full h-full flex flex-col p-6 bg-card/80 dark:bg-zinc-900 rounded-xl"
    >
      <div className="flex-grow flex flex-col">
        <figure className="overflow-hidden rounded-lg relative mb-4">
          {article.coverUrl ? (
            <Image
              src={article.coverUrl}
              alt={article.title}
              width={500}
              height={281}
              className="object-cover object-center aspect-video"
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="aspect-video bg-muted/50"></div>
          )}
          {article.category && (
            <span
              className="absolute top-2 left-2 px-3 py-1 bg-black/30 backdrop-blur-sm text-sm rounded-full text-white"
            >
              {article.category.name}
            </span>
          )}
        </figure>
        
        <div className="flex-grow">
            <h3 className="text-xl font-headline text-pretty mt-2 text-foreground hover:text-primary transition-colors duration-300 clamp-text-h3">
              {article.title}
            </h3>

            {article.excerpt && (
              <p className="line-clamp-3 text-base text-foreground/60 mt-2 transition-opacity duration-300">
                {article.excerpt}
              </p>
            )}
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-3 mt-6 pt-4 border-t border-dashed border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          {article.author?.avatarUrl && (
            <Image 
              src={article.author.avatarUrl}
              alt={article.author.name || 'Author'}
              width={40}
              height={40}
              className="rounded-full size-10 object-cover"
              sizes="40px"
            />
          )}
          <div>
            <p className="text-base font-medium text-foreground">{article.author?.name}</p>
             {publishedDate && (
              <time dateTime={publishedDate.toISOString()} className="text-sm text-foreground/50">
                {format(publishedDate, "dd MMM yyyy", { locale: es })}
              </time>
            )}
          </div>
        </div>
        
        <div className="simple-arrow-button text-base">
          <span>Ver más</span>
          <ArrowRight className="size-5" />
        </div>
      </div>
    </Link>
  );
};
