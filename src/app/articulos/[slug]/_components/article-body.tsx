
import * as React from 'react';
import { AdSlot } from '@/components/marketing/ad-slot';

interface ArticleBodyProps {
  content?: string;
}

const parseContent = (content: string) => {
    const paragraphs = content.split('\\n\\n');
    const components: React.ReactNode[] = [];
    
    paragraphs.forEach((p, index) => {
        if (p.trim()) {
            components.push(<p key={`p-${index}`}>{p}</p>);
        }
        // Insert ad after the 2nd paragraph
        if (index === 1) {
            components.push(
                <div key="ad-1" className="my-8 md:my-12">
                    <AdSlot className="w-full h-40" />
                </div>
            );
        }
    });

    return components;
}

export const ArticleBody = ({ content }: ArticleBodyProps) => {
  if (!content) {
    return <p>Contenido no disponible.</p>;
  }

  const parsedContent = parseContent(content);

  return (
    <div className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none prose-headings:font-headline prose-headings:text-primary prose-a:text-primary hover:prose-a:underline">
        {parsedContent}
    </div>
  );
};
