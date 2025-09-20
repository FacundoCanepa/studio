
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, BookOpen } from 'lucide-react';
import Link from 'next/link';

import { saveAuthorAction } from '@/app/actions/authorActions';
import type { AuthorDoc } from '@/lib/strapi-authors';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormState } from '@/app/actions/types';
import { CoverUploader, type CoverAsset } from '@/components/media/CoverUploader';

interface AuthorFormProps {
  initialData: AuthorDoc | null;
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
  const [pendingCoverId, setPendingCoverId] = React.useState<number | null | undefined>(undefined);

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
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    if (pendingCoverId !== undefined) {
      formData.append('pendingCoverId', pendingCoverId === null ? 'null' : String(pendingCoverId));
    }
    formAction(formData);
  };

  const initialCoverAsset: CoverAsset | undefined = initialData?.avatarUrl
    ? {
        id: initialData.id,
        url: initialData.avatarUrl,
        name: 'Avatar Actual',
        size: 0,
      }
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Principal</CardTitle>
              <CardDescription>
                Completa la información del autor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" name="name" value={name} onChange={handleNameChange} required />
                {formState.errors?.name && <p className="text-sm text-destructive">{formState.errors.name[0]}</p>}
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea id="bio" name="bio" defaultValue={initialData?.bio ?? ''} rows={8} />
                {formState.errors?.bio && <p className="text-sm text-destructive">{formState.errors.bio[0]}</p>}
              </div>
            </CardContent>
          </Card>
          
           {initialData?.articles && initialData.articles.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Artículos Publicados
                    </CardTitle>
                     <CardDescription>
                        Lista de artículos escritos por este autor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {initialData.articles.map(article => (
                            <li key={article.id}>{article.title}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
           )}

        </div>

        <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <CoverUploader
                  documentId={initialData?.documentId || ''}
                  initialAsset={initialCoverAsset}
                  onAssetChange={setPendingCoverId}
                />
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
        </div>
      </div>
    </form>
  );
}
