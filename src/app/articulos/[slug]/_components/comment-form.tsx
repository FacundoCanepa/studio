'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  initialContent?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

export function CommentForm({
  onSubmit,
  initialContent = '',
  submitLabel = 'Publicar',
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = React.useState(initialContent);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
        toast({ title: 'El comentario no puede estar vacío.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    try {
        await onSubmit(content);
        if (!initialContent) { // Solo limpia si es un comentario nuevo
            setContent('');
        }
    } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu comentario..."
        className="w-full min-h-[80px] resize-none overflow-hidden"
        disabled={isLoading}
      />
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                Cancelar
            </Button>
        )}
        <Button type="submit" disabled={isLoading || !content.trim()}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
