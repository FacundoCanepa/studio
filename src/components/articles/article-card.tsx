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
    <Link href={`/articulos/${article.slug}`} className="block">
      <div className="neo-card group">
        <div className="neo-card-image-wrapper">
          {article.coverUrl && (
            <Image
              src={article.coverUrl}
              alt={article.title}
              fill
              className="object-cover"
            />
          )}
          <div className="neo-card-overlay"></div>
          <div className="neo-card-content">
            {article.category && (
              <p className="neo-card-category">
                {article.category.name}
              </p>
            )}
            <p className="neo-card-title">{article.title}</p>
            {article.excerpt && (
              <p className="neo-card-body">
                {article.excerpt}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-auto flex items-end justify-between px-2 pt-4">
          <div className="neo-footer">
            {article.author?.name && (
              <>
                Por <span className="by-name">{article.author.name}</span>
              </>
            )}
            {publishedDate && article.author?.name && " | "}
            {publishedDate && (
              <span className="date">
                {format(publishedDate, "dd/MM/yy", { locale: es })}
              </span>
            )}
          </div>
           <button className="neo-button">Ver más</button>
        </div>
      </div>
    </Link>
  );
};