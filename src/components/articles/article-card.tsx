import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  article: ArticleDoc;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  if (!article) return null;

  return (
    <Link href={`/articulos/${article.slug}`} className="glass-card-box group">
        <span></span>
        <div className="glass-card-content">
            {article.coverUrl && (
                <Image
                    src={article.coverUrl}
                    alt={article.title}
                    fill
                    className="object-cover rounded-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                />
            )}
            <div className="relative z-10 flex flex-col justify-end h-full p-4">
                {article.category && (
                     <p className="font-bold text-sm uppercase text-primary-foreground/70 tracking-widest">{article.category.name}</p>
                )}
                <h3 className="font-headline text-2xl text-white mt-2">
                    {article.title}
                </h3>
            </div>
        </div>
    </Link>
  );
};
