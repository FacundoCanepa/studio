import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Share2 } from 'lucide-react';
import { TikTokIcon } from '../icons/tiktok-icon';

interface ArticleCardProps {
  article: ArticleDoc;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  if (!article) return null;

  return (
    <Link href={`/articulos/${article.slug}`} className="sci-fi-card group">
        <b></b>
        {article.coverUrl && (
            <Image
                src={article.coverUrl}
                alt={article.title}
                width={250}
                height={250}
            />
        )}
        <div className="sci-fi-content">
            <h3 className="title font-headline">
                {article.title}
                {article.category && <span>{article.category.name}</span>}
            </h3>
            <ul className="sci">
                <li><a href="#"><Share2 className="w-4 h-4" /></a></li>
                <li><a href="#"><Instagram className="w-4 h-4" /></a></li>
                <li><a href="#"><Facebook className="w-4 h-4" /></a></li>
            </ul>
        </div>
    </Link>
  );
};
