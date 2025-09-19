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
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [avatarUrl, setAvatarUrl] = React.useState(initialData?.avatarUrl ?? '');

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Principal</CardTitle>
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
                <Label htmlFor="role">Rol o Título</Label>
                <Input id="role" name="role" defaultValue={initialData?.role ?? ''} placeholder="Ej: Editor de Moda" />
                {formState.errors?.role && <p className="text-sm text-destructive">{formState.errors.role[0]}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea id="bio" name="bio" defaultValue={initialData?.bio ?? ''} rows={8} />
                {formState.errors?.bio && <p className="text-sm text-destructive">{formState.errors.bio[0]}</p>}
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Redes Sociales y Web</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" name="instagram" defaultValue={initialData?.instagram ?? ''} placeholder="https://instagram.com/usuario" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input id="tiktok" name="tiktok" defaultValue={initialData?.tiktok ?? ''} placeholder="https://tiktok.com/@usuario" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input id="youtube" name="youtube" defaultValue={initialData?.youtube ?? ''} placeholder="https://youtube.com/c/canal" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input id="website" name="website" defaultValue={initialData?.website ?? ''} placeholder="https://sitiopersonal.com" />
                </div>
            </CardContent>
           </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Avatar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={avatarUrl || undefined} alt={name || 'Avatar'} />
                            <AvatarFallback>{name ? name.substring(0, 2) : 'AV'}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="avatarUrl">URL del Avatar</Label>
                        <Input 
                            id="avatarUrl" 
                            name="avatarUrl" 
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://ejemplo.com/imagen.jpg" 
                        />
                         {formState.errors?.avatarUrl && <p className="text-sm text-destructive">{formState.errors.avatarUrl[0]}</p>}
                    </div>
                </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="isActive">Autor Activo</Label>
                  <Switch id="isActive" name="isActive" defaultChecked={initialData?.isActive ?? true} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="featured">Autor Destacado</Label>
                  <Switch id="featured" name="featured" defaultChecked={initialData?.featured ?? false} />
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
        </div>
      </div>
    </form>
  );
}
