
import * as React from 'react';
import { AdSlot } from '@/components/marketing/ad-slot';

interface ArticleBodyProps {
  content?: string;
}

export const ArticleBody = ({ content }: ArticleBodyProps) => {
  if (!content) {
    return <p>Contenido no disponible.</p>;
  }

  // Split content into paragraphs to insert an ad
  const contentParts = content.split('</p>');
  const adIndex = 2; // Insert ad after the second paragraph

  return (
    <div className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none prose-headings:font-headline prose-headings:text-primary prose-a:text-primary hover:prose-a:underline">
      {contentParts.map((part, index) => (
        <React.Fragment key={index}>
          <div dangerouslySetInnerHTML={{ __html: part + (index < contentParts.length - 1 ? '</p>' : '') }} />
          {index === adIndex - 1 && (
             <div className="my-8 md:my-12 not-prose">
                <AdSlot className="w-full h-40" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
