
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Loader2, Plus } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FavoriteTagButtonProps {
  tagId: number;
}

export const FavoriteTagButton = ({ tagId }: FavoriteTagButtonProps) => {
  const { user, isTagFavorite, toggleTagFavorite } = React.useContext(AuthContext);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!user) {
    return null; // Don't show if not logged in
  }

  const isSaved = isTagFavorite(tagId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      const result = await toggleTagFavorite(tagId);
       toast({
          title: result ? '¡Etiqueta Guardada!' : 'Etiqueta eliminada',
          description: result
            ? 'Este tema se agregó a tus favoritos.'
            : 'Este tema se eliminó de tus favoritos.',
        });
    } catch (error: any) {
        toast({
            title: 'Error',
            description: error.message || 'No se pudo actualizar tu lista de temas favoritos.',
            variant: 'destructive',
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="icon"
      className={cn(
        "rounded-full h-6 w-6 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground shadow-md",
        isSaved && "bg-primary text-primary-foreground"
      )}
      onClick={handleToggle}
      disabled={loading}
      aria-label="Guardar etiqueta"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isSaved ? (
        <Bookmark className="h-3 w-3" />
      ) : (
        <Plus className="h-3 w-3" />
      )}
    </Button>
  );
};
