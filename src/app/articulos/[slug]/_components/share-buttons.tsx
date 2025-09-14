
'use client';

import { Button } from '@/components/ui/button';
import type { ArticleDoc } from '@/lib/firestore-types';
import { LinkIcon, Facebook, Twitter, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  article: ArticleDoc;
}

export const ShareButtons = ({ article }: ShareButtonsProps) => {
  const { toast } = useToast();
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    toast({
      title: '¡Enlace copiado!',
      description: 'Ya puedes compartirlo donde quieras.',
    });
  };

  const shareOptions = [
    {
      name: 'Facebook',
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
    {
      name: 'Twitter',
      Icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(article.title)}`,
    },
    {
      name: 'Email',
      Icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`Echa un vistazo a este artículo: ${pageUrl}`)}`,
    },
  ];

  return (
    <div className="space-y-3">
        <h3 className="font-headline text-lg">Compartir</h3>
        <Button
            variant="outline"
            className="w-full justify-start"
            onClick={copyLink}
        >
            <LinkIcon className="mr-2 h-4 w-4" />
            Copiar enlace
        </Button>
      {shareOptions.map(({ name, Icon, href }) => (
        <Button
          key={name}
          variant="outline"
          className="w-full justify-start"
          asChild
        >
          <a href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="mr-2 h-4 w-4" />
            Compartir en {name}
          </a>
        </Button>
      ))}
    </div>
  );
};
