

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
import { TagInput } from './tag-input';
import { CoverUploader, type CoverAsset } from '@/components/media/CoverUploader';
import { CarouselUploader, type CarouselAsset } from '@/components/media/CarouselUploader';

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
const generateSlug = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

    export function ArticleForm({ article, authors, categories, allTags }: ArticleFormProps) {
      const [formState, formAction] = useFormState(
        saveArticleAction.bind(null, article?.documentId || null),
        initialState
      );
      const { toast } = useToast();
      const router = useRouter();
    
      const [pending, setPending] = React.useState(false);
      const [title, setTitle] = React.useState(() => article?.title ?? '');
      const [slug, setSlug] = React.useState(() => article?.slug ?? '');
      const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(() => Boolean(article?.slug));
    
      // ⬇️ ESTO ESTABA AFUERA: mover acá
      const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(() => {
        if (article?.category?.id != null) return String(article.category.id);
        if (categories.length > 0) return String(categories[0]!.id);
        return undefined;
      });
    
      const [selectedAuthor, setSelectedAuthor] = React.useState<string | undefined>(() => {
        if (article?.author?.id != null) return String(article.author.id);
        if (authors.length > 0) return String(authors[0]!.id);
        return undefined;
      });
    
      React.useEffect(() => {
        const articleCategoryId = article?.category?.id != null ? String(article.category.id) : undefined;
        if (articleCategoryId && articleCategoryId !== selectedCategory) {
          setSelectedCategory(articleCategoryId);
          return;
        }
        if (!articleCategoryId && !selectedCategory && categories.length > 0) {
          setSelectedCategory(String(categories[0]!.id));
        }
      }, [article?.category?.id, categories, selectedCategory]);
    
      React.useEffect(() => {
        const articleAuthorId = article?.author?.id != null ? String(article.author.id) : undefined;
        if (articleAuthorId && articleAuthorId !== selectedAuthor) {
          setSelectedAuthor(articleAuthorId);
          return;
        }
        if (!articleAuthorId && !selectedAuthor && authors.length > 0) {
          setSelectedAuthor(String(authors[0]!.id));
        }
      }, [article?.author?.id, authors, selectedAuthor]);
      // ⬆️ FIN del bloque movido
    
      // … el resto de tu componente sigue igual
    
   
export function ArticleForm({ article, authors, categories, allTags }: ArticleFormProps) {
  const [formState, formAction] = useFormState(saveArticleAction.bind(null, article?.documentId || null), initialState);
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [title, setTitle] = React.useState(() => article?.title ?? '');
  const [slug, setSlug] = React.useState(() => article?.slug ?? '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(() => Boolean(article?.slug));
  // States to hold pending media changes
  const [pendingCoverId, setPendingCoverId] = React.useState<number | null | undefined>(undefined);
  const [pendingCarouselIds, setPendingCarouselIds] = React.useState<number[] | undefined>(
    article?.carouselMedia?.map(media => media.id)
  );

  React.useEffect(() => {
    setTitle(article?.title ?? '');

    if (article?.slug) {
      setSlug(article.slug);
      setIsSlugManuallyEdited(true);
      return;
    }

    if (article?.title) {
      setSlug(generateSlug(article.title));
    } else {
      setSlug('');
    }

    setIsSlugManuallyEdited(false);
  }, [article]);

  const handleTitleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = event.target.value;
      setTitle(newTitle);

      if (!isSlugManuallyEdited) {
        setSlug(generateSlug(newTitle));
      }
    },
    [isSlugManuallyEdited]
  );
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
    
    // Append pending media IDs to the form data
    if (pendingCoverId !== undefined) {
      formData.append('pendingCoverId', pendingCoverId === null ? 'null' : String(pendingCoverId));
    }
    if (pendingCarouselIds !== undefined) {
      formData.append('pendingCarouselIds', JSON.stringify(pendingCarouselIds));
    }
    
    formAction(formData);
  }
  
  const initialCoverAsset = article?.coverUrl ? {
      id: article.id, // Placeholder, needs actual media ID if available
      url: article.coverUrl,
      name: 'Cover Actual',
      size: 0 // Strapi doesn't provide size easily in article payload
  } : undefined;

  const initialCarouselAssets = article?.carouselMedia?.map((media, index) => ({
    id: media.id,
    url: media.url,
      name: `Imagen ${index + 1}`,
      size: 0,
      isNew: false
  })) || [];
  const handleCarouselIdsChange = React.useCallback((ids: number[]) => {
    if (!article?.carouselMedia && ids.length === 0) {
      setPendingCarouselIds(undefined);
      return;
    }

    setPendingCarouselIds(ids);
  }, [article?.carouselMedia, setPendingCarouselIds]);

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
                <Input id="title" name="title" value={title} onChange={handleTitleChange} required />
                {formState.errors?.title && <p className="text-sm text-destructive">{formState.errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  required
                  readOnly
                />
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
                <CardTitle>Imagen de Portada</CardTitle>
            </CardHeader>
            <CardContent>
                 <CoverUploader
                    documentId={article?.documentId || ''}
                    initialAsset={initialCoverAsset as CoverAsset | undefined}
                    onAssetChange={setPendingCoverId}
                 />
            </CardContent>
          </Card>

          <CarouselUploader
              documentId={article?.documentId || ''}
              initialAssets={initialCarouselAssets as CarouselAsset[]}
              onAssetIdsChange={handleCarouselIdsChange}
              max={8}
            />

          <Card>
            <CardHeader>
              <CardTitle>Metadatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <input type="hidden" name="category" value={selectedCategory ?? ''} />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                <input type="hidden" name="author" value={selectedAuthor ?? ''} />
                <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
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
                <TagInput 
                    name="tags"
                    defaultValue={article?.tags.map(t => t.name) || []}
                    allTags={allTags.map(t => t.name)}
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
