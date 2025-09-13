import type { ArticleDoc } from '@/lib/firestore-types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: ArticleDoc;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  if (!article) return null;

  return (
    <Link href={`/articulos/${article.slug}`} className="glow-card group">
        {article.coverUrl && (
            <Image
                src={article.coverUrl}
                alt={article.title}
                fill
                className="glow-card-image"
            />
        )}
        <div className="glow-card-content">
            {article.category && (
                <Badge variant="secondary" className="self-start z-[2]">
                {article.category.name}
                </Badge>
            )}
            <h3 className="glow-card-heading font-headline">{article.title}</h3>
            <p>{article.excerpt}</p>
            <p className="glow-card-footer flex items-center gap-2">
                Ver más <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </p>
        </div>
    </Link>
  );
};
