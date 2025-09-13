import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  article: ArticleDoc;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  if (!article) return null;

  return (
    <Link href={`/articulos/${article.slug}`} className="wave-card group">
      <div className="wave-card-wave"></div>
      <div className="wave-card-wave"></div>
      <div className="wave-card-wave"></div>
      
      <div className="wave-card-content">
        {article.coverUrl && (
          <div className="relative w-full h-32 rounded-lg overflow-hidden">
            <Image
              src={article.coverUrl}
              alt={article.title}
              fill
              className="object-cover"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
        )}
        
        <div className="flex flex-col items-center">
            {article.category && (
                <p className="font-bold text-sm uppercase text-white/70 tracking-widest">{article.category.name}</p>
            )}
            <h3 className="font-headline text-2xl text-white mt-2 leading-tight">
                {article.title}
            </h3>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <p className="text-sm font-semibold">Ver más &rarr;</p>
        </div>
      </div>
    </Link>
  );
};
