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
  // Simplified reading time calculation
  const readingTime = article.contentHtml ? Math.ceil(article.contentHtml.split(/\s+/).length / 200) : 4;


  return (
    <Link 
      href={`/articulos/${article.slug}`} 
      className="w-full max-w-sm hover:scale-105 transition-transform duration-300 group p-4 bg-card/80 dark:bg-zinc-900 rounded-xl"
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
      
      {publishedDate && (
        <time dateTime={publishedDate.toISOString()} className="text-xs text-foreground/50">
          {format(publishedDate, "dd MMM yyyy", { locale: es })}
          <span className="mx-2">⦁</span>
          {readingTime} min read
        </time>
      )}

      <p className="text-lg font-headline text-pretty mt-2 text-foreground">
        {article.title}
      </p>

      {article.excerpt && (
         <p className="line-clamp-2 text-sm text-foreground/60 mt-1 group-hover:text-foreground/90 transition-opacity duration-300">
           {article.excerpt}
         </p>
      )}
      
      <div className="flex items-center gap-3 mt-4">
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
    </Link>
  );
};
