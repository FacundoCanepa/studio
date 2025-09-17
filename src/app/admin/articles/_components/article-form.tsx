

'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { saveArticleAction } from '@/app/actions/articleActions';
import type { ArticleDoc, AuthorDoc, CategoryDoc, TagDoc } from '@/lib/firestore-types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { InputWithBadges } from './input-with-badges';

interface ArticleFormProps {
  article: ArticleDoc | null;
  authors: AuthorDoc[];
  categories: CategoryDoc[];
  allTags: TagDoc[];
}

const initialState = {
  message: '',
  errors: {},
  success: false,
};

export function ArticleForm({ article, authors, categories, allTags }: ArticleFormProps) {
  const [formState, formAction] = useFormState(saveArticleAction.bind(null, article?.documentId || null), initialState);
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? 'Éxito' : 'Error',
        description: formState.message,
        variant: formState.success ? 'default' : 'destructive',
      });
      if (formState.success) {
        router.push('/admin/articles');
      }
      setPending(false);
    }
  }, [formState, toast, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    formAction(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Contenido Principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" defaultValue={article?.title} required />
                {formState.errors?.title && <p className="text-sm text-destructive">{formState.errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={article?.slug} required />
                {formState.errors?.slug && <p className="text-sm text-destructive">{formState.errors.slug}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Extracto</Label>
                <Textarea id="excerpt" name="excerpt" defaultValue={article?.excerpt} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Contenido (Markdown)</Label>
                <Textarea id="content" name="content" defaultValue={article?.contentHtml} rows={15} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="urlYoutube">URL de YouTube</Label>
                <Input id="urlYoutube" name="urlYoutube" defaultValue={article?.urlYoutube || ''} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="contentMore">Contenido Adicional</Label>
                <Textarea id="contentMore" name="contentMore" defaultValue={article?.contentMore || ''} rows={5} />
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>Configuración de optimización para motores de búsqueda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Título</Label>
                <Input id="metaTitle" name="metaTitle" defaultValue={article?.seo?.metaTitle || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Descripción</Label>
                <Textarea id="metaDescription" name="metaDescription" defaultValue={article?.seo?.metaDescription || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">URL Canónica</Label>
                <Input id="canonicalUrl" name="canonicalUrl" defaultValue={article?.seo?.canonicalUrl || ''} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Metadatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select name="category" defaultValue={String(article?.category?.id)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {formState.errors?.category && <p className="text-sm text-destructive">{formState.errors.category}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Select name="author" defaultValue={String(article?.author?.id)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un autor" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map(author => (
                      <SelectItem key={author.id} value={String(author.id)}>{author.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {formState.errors?.author && <p className="text-sm text-destructive">{formState.errors.author}</p>}
              </div>
               <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <InputWithBadges 
                    name="tags" 
                    defaultValue={article?.tags.map(t => t.name) || []}
                    existingTags={allTags.map(t => t.name)}
                />
              </div>

               <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="featured">Destacado</Label>
                    <Switch id="featured" name="featured" defaultChecked={article?.featured} />
                  </div>
                   <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="home">Mostrar en Home</Label>
                    <Switch id="home" name="home" defaultChecked={article?.home} />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="isNew">Marcar como Nuevo</Label>
                    <Switch id="isNew" name="isNew" defaultChecked={article?.isNew} />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="tendencias">Marcar como Tendencia</Label>
                    <Switch id="tendencias" name="tendencias" defaultChecked={article?.tendencias} />
                  </div>
               </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {article ? 'Actualizar Artículo' : 'Crear Artículo'}
          </Button>
        </div>
      </div>
    </form>
  );
}
