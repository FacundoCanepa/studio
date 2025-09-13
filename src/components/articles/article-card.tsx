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
        
        <button className="arrow-button" type="button">
          <span>Ver más</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 74 74"
            height="24"
            width="24"
          >
            <circle strokeWidth="3" stroke="black" r="35.5" cy="37" cx="37"></circle>
            <path
              fill="black"
              d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z"
            ></path>
          </svg>
        </button>
      </div>
    </Link>
  );
};
