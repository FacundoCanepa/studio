import Link from 'next/link';
import Image from 'next/image';
import type { AuthorDoc } from '@/lib/firestore-types';

interface AuthorCardProps {
  author: AuthorDoc;
}

export const AuthorCard = ({ author }: AuthorCardProps) => {
  if (!author) return null;

  // Extract the first paragraph from the bio blocks for the short bio
  const bioFirstParagraph = author.bioBlocks?.[0]?.children?.[0]?.text || 'Sin biografía disponible.';

  return (
    <Link href={`/autores/${author.documentId}`} className="book-container">
      <div className="book">
        <div className="cover">
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={`Portada de ${author.name}`}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Sin foto</span>
            </div>
          )}
        </div>
        <div className="book-content p-6">
            <h3 className="text-xl font-headline font-bold mb-2">{author.name}</h3>
            <p className="text-sm text-foreground/70 line-clamp-4">
              {bioFirstParagraph}
            </p>
        </div>
      </div>
    </Link>
  );
};
