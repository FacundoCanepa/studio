
import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import { FavoriteTagButton } from './favorite-tag-button';

interface ArticleTagsProps {
  tags: ArticleDoc['tags'];
}

export const ArticleTags = ({ tags }: ArticleTagsProps) => {
  return (
    <div className="border-t pt-6">
      <h3 className="font-headline text-lg mb-4">Etiquetas</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.documentId} className="group relative">
            <Link
              href={`/articulos?tag=${tag.slug}`} 
              className="pl-3 pr-4 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors flex items-center"
            >
              {tag.name}
            </Link>
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <FavoriteTagButton tagId={tag.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
