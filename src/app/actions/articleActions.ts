

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { StrapiTag } from '@/lib/strapi-types';
import { performStrapiRequest } from '@/lib/strapi-api';
import { patchArticleByDocumentId } from '@/lib/strapi-article';
import { toStrapiSlug } from '@/lib/strapiSlug';

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
           // enforced pagination to reduce API calls
           const allTagsResponse = await performStrapiRequest('/api/tags?pagination[page]=1&pagination[pageSize]=12', { method: 'GET' });
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
                    body: { data: { name: tagName, slug: toStrapiSlug(tagName) } },
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
    
    console.log(
      `[SAVE_ARTICLE_ACTION] Final payload for ${documentId ?? 'new article'}:`,
      JSON.stringify(payload, null, 2)
    );

    let resultingDocumentId = documentId;

    if (!documentId) {
      console.log('[SAVE_ARTICLE_ACTION] No documentId provided. Creating a new article.');
      const createResponse = await performStrapiRequest('/api/articles', {
        method: 'POST',
        body: { data: payload },
      });

      const createdData = createResponse?.data;
      const createdDocumentId =
        createdData?.documentId ??
        createdData?.data?.documentId ??
        createdData?.attributes?.documentId ??
        createdData?.data?.attributes?.documentId ??
        null;

      if (createdDocumentId) {
        resultingDocumentId = createdDocumentId;
      } else {
        console.warn('[SAVE_ARTICLE_ACTION] Could not determine documentId from creation response.');
      }

      console.log(
        `[SAVE_ARTICLE_ACTION] Successfully created article${
          resultingDocumentId ? ` with documentId ${resultingDocumentId}` : ''
        }.`
      );
    } else {
      await patchArticleByDocumentId(documentId, payload);
      console.log(`[SAVE_ARTICLE_ACTION] Successfully updated article with documentId ${documentId}.`);
    }
  
    
    revalidatePath('/admin/articles');
    revalidatePath(`/articulos/${slug}`);
    revalidatePath('/');
    if (resultingDocumentId) {
      revalidatePath(`/admin/articles/edit/${resultingDocumentId}`);
    }

    const successMessage = documentId ? 'Artículo actualizado con éxito.' : 'Artículo creado con éxito.';
    return {
      message: successMessage,
      success: true,
    };
  } catch (error: any) {
    console.error('[SAVE_ARTICLE_ACTION] Error during Strapi operation:', error);
    const errorMessage = (error instanceof Error && error.message) ? error.message : 'Error al guardar el artículo.';
    return {
      message: errorMessage,
      success: false,
    };
  }
}

export async function deleteArticleAction(documentId: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_ARTICLE_ACTION] Attempting to delete article with document ID: ${documentId}`);
    try {
      const articleFetchEndpoint = `/api/articles?filters[documentId][$eq]=${documentId}&pagination[page]=1&pagination[pageSize]=1`; // enforced pagination to reduce API calls
      const articleResponse = await performStrapiRequest(articleFetchEndpoint, { method: 'GET' });
        const articleToDelete = articleResponse.data?.[0];

        if (!articleToDelete) {
             throw new Error(`No se encontró el artículo con document ID ${documentId} para eliminarlo.`);
        }

        const deleteEndpoint = `/api/articles/${documentId}`;
        console.log(`[DELETE_ARTICLE_ACTION] Deleting using document endpoint: ${deleteEndpoint}`);

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
