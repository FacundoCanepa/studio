
import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';

interface HorizontalArticleCardProps {
  article: ArticleDoc;
}

export const HorizontalArticleCard = ({ article }: HorizontalArticleCardProps) => {
  if (!article) return null;

  return (
    <Link href={`/articulos/${article.slug}`} className="group grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
      <div className="md:col-span-2 overflow-hidden rounded-lg">
        {article.coverUrl && (
          <Image
            src={article.coverUrl}
            alt={article.title}
            width={600}
            height={400}
            className="object-cover w-full h-full aspect-video md:aspect-[4/3] transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="md:col-span-3">
        {article.category && (
            <p className="text-sm font-medium text-primary-foreground/70 mb-2">{article.category.name}</p>
        )}
        <h3 className="text-3xl font-headline text-pretty text-primary-foreground group-hover:underline">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-4 text-base text-primary-foreground/80 line-clamp-3">
            {article.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
};
