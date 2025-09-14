
import type { ArticleDoc } from '@/lib/firestore-types';
import Link from 'next/link';

interface ArticleTagsProps {
  tags: ArticleDoc['tags'];
}

export const ArticleTags = ({ tags }: ArticleTagsProps) => {
  return (
    <div className="border-t pt-6">
      <h3 className="font-headline text-lg mb-4">Etiquetas</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.documentId}
            href={`/categoria/${tag.slug}`} 
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
};
