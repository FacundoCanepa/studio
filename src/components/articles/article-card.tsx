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
    <Link href={`/articulos/${article.slug}`} className="group flex flex-col gap-4">
      {article.coverUrl && (
        <div className="overflow-hidden rounded-lg">
          <Image
            src={article.coverUrl}
            alt={article.title}
            width={600}
            height={400}
            className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      <div className="flex flex-col gap-1">
        {article.category && (
          <p className="font-code text-sm uppercase tracking-widest text-primary">
            {article.category.name}
          </p>
        )}
        <h3 className="font-headline text-2xl font-medium leading-tight text-foreground group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        {publishedDate && (
           <p className="text-sm text-muted-foreground mt-1">
            {format(publishedDate, "d 'de' LLLL 'de' yyyy", { locale: es })}
          </p>
        )}
      </div>
    </Link>
  );
};
