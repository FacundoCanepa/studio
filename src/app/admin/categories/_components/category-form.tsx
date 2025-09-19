
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

  React.useEffect(() => {
    if (!isSlugManuallyEdited) {
      setSlug(toStrapiSlug(name));
    }
  }, [name, isSlugManuallyEdited]);
  
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
        </CardContent>
      </Card>
      
      <SubmitButton isEditing={Boolean(category)} />
    </form>
  );
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      {isEditing ? 'Actualizar Categoría' : 'Crear Categoría'}
    </Button>
  );
}