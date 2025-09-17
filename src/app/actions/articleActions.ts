

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { StrapiTag } from '@/lib/strapi-types';
import { performStrapiRequest } from '@/lib/strapi-api';
import { patchArticleByDocumentId } from '@/lib/strapi-article';

const articleSchema = z.object({
  title: z.string().min(3, 'El título es requerido.'),
  slug: z.string().min(3, 'El slug es requerido.'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida.'),
  author: z.string().min(1, 'El autor es requerido.'),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().nullable().optional(),
  urlYoutube: z.string().optional(),
  contentMore: z.string().optional(),
  home: z.boolean().default(false),
  isNew: z.boolean().default(false),
  tendencias: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  pendingCoverId: z.string().optional(),
  pendingCarouselIds: z.string().optional(),
});

type FormState = {
  message: string;
  errors?: Record<string, string[]>;
  success: boolean;
};

export async function saveArticleAction(
  documentId: string | null,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!documentId) {
      return { success: false, message: 'Error: No se proporcionó un ID de documento para la actualización.' };
  }
  console.log('[SAVE_ARTICLE_ACTION] Started for documentId:', documentId);
  
  const rawData = Object.fromEntries(formData.entries());
  
  const dataToValidate = {
    ...rawData,
    featured: rawData.featured === 'on',
    home: rawData.home === 'on',
    isNew: rawData.isNew === 'on',
    tendencias: rawData.tendencias === 'on',
    tags: formData.getAll('tags'),
    category: rawData.category || '',
    author: rawData.author || '',
  };

  const validation = articleSchema.safeParse(dataToValidate);

  if (!validation.success) {
    console.error('[SAVE_ARTICLE_ACTION] Validation failed:', validation.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  console.log('[SAVE_ARTICLE_ACTION] Validation successful.');

  const { 
    title, slug, excerpt, content, category, author, featured, publishedAt, tags, 
    urlYoutube, contentMore, home, isNew, tendencias, metaTitle, metaDescription, canonicalUrl,
    pendingCoverId, pendingCarouselIds 
  } = validation.data;
    
  try {
    let tagIds: number[] = [];
    if (tags && tags.length > 0) {
        console.log('[SAVE_ARTICLE_ACTION] Processing tags:', tags);
        const allTagsResponse = await performStrapiRequest('/api/tags?pagination[limit]=-1', { method: 'GET' });
        const existingTags: StrapiTag[] = allTagsResponse.data || [];

        for (const tagName of tags) {
            if (!tagName) continue;
            const existingTag = existingTags.find(t => t && t.name && t.name.toLowerCase() === tagName.toLowerCase());
            if (existingTag) {
                tagIds.push(existingTag.id);
            } else {
                console.log(`[SAVE_ARTICLE_ACTION] Creating new tag '${tagName}'.`);
                const newTagResponse = await performStrapiRequest('/api/tags', {
                    method: 'POST',
                    body: JSON.stringify({ data: { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') } }),
                });
                if (newTagResponse.data) {
                    tagIds.push(newTagResponse.data.id);
                }
            }
        }
        console.log('[SAVE_ARTICLE_ACTION] Final tag IDs:', tagIds);
    }

    const payload: Record<string, any> = {
        title, slug, excerpt, Content: content,
        category: category ? Number(category) : null,
        author: author ? Number(author) : null,
        featured, publishedAt: publishedAt || null, 
        tags: tagIds, UrlYoutube: urlYoutube,
        ContentMore: contentMore, home: home, New: isNew, 
        Tendencias: tendencias,
        Name: { metaTitle, metaDescription, canonicalUrl }
    };

    if (pendingCoverId !== undefined) {
        const coverId = pendingCoverId === 'null' ? null : Number(pendingCoverId);
        payload.Cover = coverId;
    }
    
    if (pendingCarouselIds !== undefined) {
        try {
            const carouselIds = JSON.parse(pendingCarouselIds);
            if(Array.isArray(carouselIds) && carouselIds.every(id => typeof id === 'number')) {
                payload.Carosel = carouselIds;
            }
        } catch (e) {
            console.warn('[SAVE_ARTICLE_ACTION] Could not parse pendingCarouselIds');
        }
    }
    
    console.log(`[SAVE_ARTICLE_ACTION] Final payload for doc ${documentId}:`, JSON.stringify(payload, null, 2));

    await patchArticleByDocumentId(documentId, payload);

    console.log(`[SAVE_ARTICLE_ACTION] Successfully updated article with documentId ${documentId}.`);
    
    revalidatePath('/admin/articles');
    revalidatePath(`/articulos/${slug}`);
    revalidatePath('/');
    revalidatePath(`/admin/articles/edit/${documentId}`);

    return {
      message: 'Artículo actualizado con éxito.',
      success: true,
    };
  } catch (error: any) {
    console.error('[SAVE_ARTICLE_ACTION] Error during Strapi operation:', error);
    return {
      message: `Error al guardar el artículo: ${error.message}`,
      success: false,
    };
  }
}

export async function deleteArticleAction(documentId: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_ARTICLE_ACTION] Attempting to delete article with document ID: ${documentId}`);
    try {
        const articleResponse = await performStrapiRequest(`/api/articles?filters[documentId][$eq]=${documentId}`, { method: 'GET' });
        const articleToDelete = articleResponse.data?.[0];

        if (!articleToDelete) {
             throw new Error(`No se encontró el artículo con document ID ${documentId} para eliminarlo.`);
        }
        
        const deleteEndpoint = `/api/articles/${articleToDelete.id}`;
        console.log(`[DELETE_ARTICLE_ACTION] Deleting at endpoint: ${deleteEndpoint}`);

        await performStrapiRequest(deleteEndpoint, { method: 'DELETE' });
        
        console.log(`[DELETE_ARTICLE_ACTION] Successfully deleted article ${documentId}. Revalidating paths.`);
        revalidatePath('/admin/articles');
        revalidatePath('/');

        return { success: true, message: 'Artículo eliminado con éxito.' };

    } catch (error: any) {
        console.error(`[DELETE_ARTICLE_ACTION] Exception caught for article document ID ${documentId}:`, error);
        return { success: false, message: error.message };
    }
}
