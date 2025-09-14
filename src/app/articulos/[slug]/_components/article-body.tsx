
import * as React from 'react';
import { AdSlot } from '@/components/marketing/ad-slot';

interface ArticleBodyProps {
  content?: string;
}

export const ArticleBody = ({ content }: ArticleBodyProps) => {
  if (!content) {
    return <p>Contenido no disponible.</p>;
  }

  // [RESPONSIVE FIX - /articulos/[slug]]: Insert ad more intelligently.
  // Only show ad if content is long enough (e.g., > 4 paragraphs)
  // and place it in the middle for a less intrusive experience.
  const contentParts = content.split('</p>');
  const shouldShowAd = contentParts.length > 4;
  const adIndex = shouldShowAd ? Math.floor(contentParts.length / 2) : -1;

  return (
    <div className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none prose-p:my-6 prose-headings:font-headline prose-headings:text-primary prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
      {contentParts.map((part, index) => (
        <React.Fragment key={index}>
          <div dangerouslySetInnerHTML={{ __html: part + (index < contentParts.length - 1 ? '</p>' : '') }} />
          {index === adIndex && (
             <div className="my-8 md:my-12 not-prose">
                <AdSlot className="w-full h-40" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
