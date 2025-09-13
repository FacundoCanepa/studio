
import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalArticleCardProps {
  article: ArticleDoc;
}

export const HorizontalArticleCard = ({ article }: HorizontalArticleCardProps) => {
  if (!article) return null;
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;

  return (
    <div className="layered-card">
      <div className="layered-card-content">
        <Link href={`/articulos/${article.slug}`} className="group grid grid-cols-1 md:grid-cols-5 gap-8 items-center p-8">
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
          <div className="md:col-span-3 flex flex-col h-full">
            <div className="flex-grow">
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
            
            <div className="flex items-end justify-between gap-3 mt-6 pt-4 border-t border-dashed border-white/20">
                <div className="flex items-center gap-3">
                {article.author?.avatarUrl && (
                    <Image 
                    src={article.author.avatarUrl}
                    alt={article.author.name || 'Author'}
                    width={40}
                    height={40}
                    className="rounded-full size-10 object-cover"
                    />
                )}
                <div>
                    <p className="text-base font-medium text-primary-foreground">{article.author?.name}</p>
                    {publishedDate && (
                    <time dateTime={publishedDate.toISOString()} className="text-sm text-primary-foreground/50">
                        {format(publishedDate, "dd MMM yyyy", { locale: es })}
                    </time>
                    )}
                </div>
                </div>
                
                <div className="simple-arrow-button text-base text-primary-foreground/70 hover:text-primary-foreground">
                  <span>Ver más</span>
                  <ArrowRight className="size-5" />
                </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};
