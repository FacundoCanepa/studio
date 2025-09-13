import type { ArticleDoc } from '@/lib/firestore-types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ArticleCardProps {
  article: ArticleDoc;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  if (!article) return null;

  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;
  const month = publishedDate ? publishedDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') : '';
  const day = publishedDate ? publishedDate.getDate() : '';

  return (
    <div className="card-3d-parent">
      <div className="card-3d group">
        <div className="card-3d-content">
          {article.category && (
            <Badge variant="secondary" className="mb-4" style={{ transform: 'translate3d(0, 0, 20px)' }}>
              {article.category.name}
            </Badge>
          )}

          <h3 className="card-title font-headline">{article.title}</h3>
          <p className="card-text">{article.excerpt}</p>
          
          <Link href={`/articulos/${article.slug}`} className="see-more">
            Ver más
          </Link>
        </div>
        
        {publishedDate && (
          <div className="card-3d-date-box">
            <span className="month">{month}</span>
            <span className="date">{day}</span>
          </div>
        )}
      </div>
    </div>
  );
};
