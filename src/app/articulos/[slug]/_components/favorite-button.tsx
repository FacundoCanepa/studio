
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Loader2 } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  articleId: number;
}

export const FavoriteButton = ({ articleId }: FavoriteButtonProps) => {
  const { user, isFavorite, toggleFavorite } = React.useContext(AuthContext);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!user) {
    return (
        <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/login')}>
            <Bookmark className="mr-2 h-4 w-4" />
            Ingresa para guardar
        </Button>
    )
  }

  const isSaved = isFavorite(articleId);

  const handleToggle = async () => {
    console.log(`[FavoriteButton] Clicked. Article ID: ${articleId}`);
    setLoading(true);
    try {
      const result = await toggleFavorite(articleId);
       toast({
          title: result ? '¡Guardado!' : 'Eliminado de tus guardados',
          description: result
            ? 'Este artículo se agregó a tu lista.'
            : 'Este artículo se eliminó de tu lista.',
        });
    } catch (error: any) {
        console.error('[FavoriteButton] Error toggling favorite:', error);
        toast({
            title: 'Error',
            description: error.message || 'No se pudo actualizar tu lista de favoritos.',
            variant: 'destructive',
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      className="w-full justify-start"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "fill-current")} />
      )}
      {isSaved ? 'Guardado' : 'Guardar'}
    </Button>
  );
};
