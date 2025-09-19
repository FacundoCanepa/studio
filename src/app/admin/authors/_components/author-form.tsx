
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X } from 'lucide-react';
import Link from 'next/link';

import { saveAuthorAction } from '@/app/actions/authorActions';
import type { AuthorDoc } from '@/lib/strapi-authors';
import { toKebabCase } from '@/lib/validation/author-schema';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormState } from '@/app/actions/types';

interface AuthorFormProps {
  initialData: Partial<AuthorDoc> | null;
}

const initialState: FormState = {
  message: '',
  errors: {},
  success: false,
};

export function AuthorForm({ initialData }: AuthorFormProps) {
  const documentId = initialData?.documentId || null;
  const [formState, formAction] = useFormState(saveAuthorAction.bind(null, documentId), initialState);
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const [name, setName] = React.useState(initialData?.name ?? '');
  const [slug, setSlug] = React.useState(initialData?.slug ?? '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(!!initialData?.slug);
  
  React.useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? 'Éxito' : 'Error',
        description: formState.message,
        variant: formState.success ? 'default' : 'destructive',
      });
      if (formState.success) {
        router.push('/admin/authors');
      }
      setPending(false);
    }
  }, [formState, toast, router]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isSlugManuallyEdited) {
      setSlug(toKebabCase(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    setSlug(e.target.value);
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    formAction(new FormData(event.currentTarget));
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Información Principal</CardTitle>
          <CardDescription>
            Completa la información del autor. El slug se genera automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" name="name" value={name} onChange={handleNameChange} required />
            {formState.errors?.name && <p className="text-sm text-destructive">{formState.errors.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" name="slug" value={slug} onChange={handleSlugChange} required />
            <p className="text-sm text-muted-foreground">Se genera automáticamente, pero puedes editarlo.</p>
            {formState.errors?.slug && <p className="text-sm text-destructive">{formState.errors.slug[0]}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea id="bio" name="bio" defaultValue={initialData?.bio ?? ''} rows={8} />
            {formState.errors?.bio && <p className="text-sm text-destructive">{formState.errors.bio[0]}</p>}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-4">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {documentId ? 'Actualizar Autor' : 'Crear Autor'}
        </Button>
         <Button variant="outline" asChild>
            <Link href="/admin/authors">
                <X className="mr-2 h-4 w-4" />
                Cancelar
            </Link>
         </Button>
      </div>
    </form>
  );
}
