'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { saveGalleryItemAction } from '@/app/actions/galleryActions';
import type { GalleryItemDoc } from '@/lib/firestore-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { CoverUploader, type CoverAsset } from '@/components/media/CoverUploader';

interface GalleryFormProps {
  item: GalleryItemDoc | null;
}

const initialState = {
  message: '',
  errors: {} as Record<string, string>,
  success: false,
};

export function GalleryForm({ item }: GalleryFormProps) {
  const [formState, formAction] = useFormState(
    saveGalleryItemAction.bind(null, item?.id || null),
    initialState
  );
  const { toast } = useToast();
  const router = useRouter();

  const [pending, setPending] = React.useState(false);
  const [pendingCoverId, setPendingCoverId] = React.useState<number | null | undefined>(undefined);

  React.useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? 'Éxito' : 'Error',
        description: formState.message,
        variant: formState.success ? 'default' : 'destructive',
      });
      if (formState.success) {
        router.push('/admin/galeria');
      }
      setPending(false);
    }
  }, [formState, toast, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    if (pendingCoverId !== undefined) {
      formData.append('pendingCoverId', pendingCoverId === null ? 'null' : String(pendingCoverId));
    }
    formAction(formData);
  };
  
  const initialCoverAsset: CoverAsset | undefined = item?.imageUrl
  ? {
      id: Number(item.id), // placeholder, we need the media id, not document id
      url: item.imageUrl,
      name: 'Imagen Actual',
      size: 0,
    }
  : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Contenido del Elemento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="Famoso">Famoso</Label>
                <Input id="Famoso" name="Famoso" defaultValue={item?.title || ''} required />
                {formState.errors?.Famoso && (
                  <p className="text-sm text-destructive">{formState.errors.Famoso}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="Nota">Nota</Label>
                <Textarea id="Nota" name="Nota" defaultValue={item?.description || ''} required />
                {formState.errors?.Nota && (
                  <p className="text-sm text-destructive">{formState.errors.Nota}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Imagen</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverUploader
                documentId={item?.id || ''}
                initialAsset={initialCoverAsset}
                onAssetChange={setPendingCoverId}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {item ? 'Actualizar Elemento' : 'Crear Elemento'}
          </Button>
        </div>
      </div>
    </form>
  );
}
