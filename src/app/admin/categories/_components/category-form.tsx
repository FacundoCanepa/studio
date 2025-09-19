
'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

import { saveCategoryAction } from '@/app/actions/categoryActions';
import type { CategoryDoc } from '@/lib/firestore-types';
import { toStrapiSlug } from '@/lib/strapiSlug';
import { Input } from '@/components/ui/input';
import { STRAPI_API_TOKEN, STRAPI_URL, validateImage } from '@/lib/strapi-media-config';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';



interface CategoryFormProps {
  category: CategoryDoc | null;
}

const initialState = {
  message: '',
  errors: {} as Record<string, string[]>,
  success: false,
};

export function CategoryForm({ category }: CategoryFormProps) {
  const [formState, formAction] = useFormState(
    saveCategoryAction.bind(null, category?.documentId || null),
    initialState
  );
  const { toast } = useToast();
  const router = useRouter();

  // Title / Slug
  const [name, setName] = React.useState(category?.name || '');
  const [slug, setSlug] = React.useState(category?.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(Boolean(category?.slug));
  const [imgId, setImgId] = React.useState<string | null>(null);
  const [imgUrl, setImgUrl] = React.useState<string | null>(category?.imageUrl ?? null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isSlugManuallyEdited) {
      setSlug(toStrapiSlug(name));
    }
  }, [name, isSlugManuallyEdited]);
   const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const validation = validateImage(file);
      if (!validation.ok) {
        setUploadError(validation.error ?? 'El archivo seleccionado no es válido.');
        toast({
          title: 'Error al subir la imagen',
          description: validation.error,
          variant: 'destructive',
        });
        event.target.value = '';
        return;
      }

      if (!STRAPI_URL) {
        const message =
          'La variable de entorno NEXT_PUBLIC_STRAPI_URL no está configurada. No es posible subir archivos en este momento.';
        setUploadError(message);
        toast({ title: 'Error de configuración', description: message, variant: 'destructive' });
        event.target.value = '';
        return;
      }

      if (!STRAPI_API_TOKEN) {
        const message =
          'La variable de entorno STRAPI_API_TOKEN no está configurada. No es posible subir archivos en este momento.';
        setUploadError(message);
        toast({ title: 'Error de configuración', description: message, variant: 'destructive' });
        event.target.value = '';
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      const normalizedBaseUrl = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
      const uploadUrl = `${normalizedBaseUrl}/api/upload`;

      try {
        const fd = new FormData();
        fd.append('files', file);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
          body: fd,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (payload as any)?.error?.message ||
            (typeof (payload as any)?.error === 'string' ? (payload as any).error : undefined) ||
            'Error al subir la imagen.';
          throw new Error(message);
        }

        const asset = Array.isArray(payload) ? payload[0] : payload;
        const assetId = asset?.id;
        const assetUrl: string | undefined = asset?.url;

        if (assetId == null || !assetUrl) {
          throw new Error('Strapi no devolvió la información de la imagen subida.');
        }

        const resolvedUrl = assetUrl.startsWith('http')
          ? assetUrl
          : `${normalizedBaseUrl}${assetUrl.startsWith('/') ? '' : '/'}${assetUrl}`;

        setImgId(String(assetId));
        setImgUrl(resolvedUrl);
        setUploadError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ocurrió un error al subir la imagen.';
        setUploadError(message);
        toast({
          title: 'Error al subir la imagen',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        event.target.value = '';
      }
    },
    [toast]
  );
  

  const handleReplaceClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  React.useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? 'Éxito' : 'Error',
        description: formState.message,
        variant: formState.success ? 'default' : 'destructive',
      });
      if (formState.success) {
        router.push('/admin/categories');
      }
    }
  }, [formState, toast, router]);

  return (
    <form action={formAction} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Categoría</CardTitle>
          <CardDescription>
            Completa la información para la nueva categoría. El "slug" se genera automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Estilo de Vida"
            />
            {formState.errors?.name && (
                <p className="text-sm text-destructive">{formState.errors.name[0]}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManuallyEdited(true);
              }}
              required
              placeholder="Ej: estilo-de-vida"
            />
            {formState.errors?.slug && (
              <p className="text-sm text-destructive">{formState.errors.slug[0]}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Esta es la URL amigable para la categoría.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={category?.description || ''}
              placeholder="Una breve descripción sobre de qué trata esta categoría."
            />
            {formState.errors?.description && (
              <p className="text-sm text-destructive">{formState.errors.description[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="img">Imagen (opcional)</Label>
            <input ref={fileInputRef} id="img" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <input type="hidden" name="imgId" value={imgId ?? ''} />
            {imgUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-md border border-dashed">
                  <img src={imgUrl} alt={`Vista previa de ${name || 'la categoría'}`} className="h-48 w-full object-cover" />
                </div>
                <Button type="button" variant="outline" onClick={handleReplaceClick} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
                    </>
                  ) : (
                    'Reemplazar'
                  )}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={handleReplaceClick} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
                  </>
                ) : (
                  'Subir imagen'
                )}
              </Button>
            )}
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
            <p className="text-sm text-muted-foreground">
              Formatos permitidos: JPG, PNG, WEBP o AVIF. Tamaño máximo: 3MB.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <SubmitButton isEditing={Boolean(category)} isUploading={isUploading} />
    </form>
  );
}

function SubmitButton({ isEditing, isUploading }: { isEditing: boolean; isUploading: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isUploading;
  const showSpinner = pending || isUploading;
  const label = isUploading
    ? 'Subiendo imagen...'
    : isEditing
      ? 'Actualizar Categoría'
      : 'Crear Categoría';
  return (
    <Button type="submit" className="w-full" disabled={isDisabled}>
      {showSpinner ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}