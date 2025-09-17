

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { StrapiTag } from '@/lib/strapi-types';
import { performStrapiRequest } from '@/lib/strapi-client';

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
  console.log('[SAVE_ARTICLE_ACTION] Started.', { documentId });
  
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
  console.log('[SAVE_ARTICLE_ACTION] Data to validate:', dataToValidate);

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

  const { title, slug, excerpt, content, category, author, featured, publishedAt, tags, urlYoutube, contentMore, home, isNew, tendencias, metaTitle, metaDescription, canonicalUrl } =
    validation.data;
    
  let tagIds: number[] = [];
  if (tags && tags.length > 0) {
      console.log('[SAVE_ARTICLE_ACTION] Processing tags:', tags);
      const allTagsResponse = await performStrapiRequest('/api/tags?pagination[limit]=-1', { method: 'GET' });
      const existingTags: StrapiTag[] = allTagsResponse.data || [];
      console.log('[SAVE_ARTICLE_ACTION] Existing tags from Strapi:', existingTags.map(t => t?.name));

      for (const tagName of tags) {
          if (!tagName) continue;
          const existingTag = existingTags.find(t => t && t.name && t.name.toLowerCase() === tagName.toLowerCase());
          if (existingTag) {
              tagIds.push(existingTag.id);
              console.log(`[SAVE_ARTICLE_ACTION] Found existing tag '${tagName}' with ID ${existingTag.id}`);
          } else {
              console.log(`[SAVE_ARTICLE_ACTION] Tag '${tagName}' not found. Creating new tag.`);
              try {
                const newTagResponse = await performStrapiRequest('/api/tags', {
                    method: 'POST',
                    body: JSON.stringify({ data: { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') } }),
                });
                if (newTagResponse.data) {
                    tagIds.push(newTagResponse.data.id);
                    console.log(`[SAVE_ARTICLE_ACTION] Created new tag '${tagName}' with ID ${newTagResponse.data.id}`);
                } else {
                    console.error(`[SAVE_ARTICLE_ACTION] Failed to create new tag '${tagName}'`, { response: newTagResponse });
                }
              } catch(e: any) {
                 console.error(`[SAVE_ARTICLE_ACTION] Exception while creating tag '${tagName}'`, e);
                 return {
                    message: `Error al crear la etiqueta '${tagName}': ${e.message}`,
                    success: false,
                 };
              }
          }
      }
      console.log('[SAVE_ARTICLE_ACTION] Final tag IDs:', tagIds);
  }


  const payload = {
    data: {
      title,
      slug,
      excerpt,
      Content: content,
      category: category ? Number(category) : null,
      author: author ? Number(author) : null,
      featured,
      publishedAt: publishedAt || null, 
      tags: tagIds,
      UrlYoutube: urlYoutube,
      ContentMore: contentMore,
      home: home,
      New: isNew, 
      Tendencias: tendencias,
      Name: {
        metaTitle,
        metaDescription,
        canonicalUrl,
      }
    },
  };
  
  console.log('[SAVE_ARTICLE_ACTION] Final payload to be sent to Strapi:', JSON.stringify(payload, null, 2));


  try {
    if (documentId) {
      console.log(`[SAVE_ARTICLE_ACTION] Updating article with documentId: ${documentId}`);
      // Use documentId directly in the URL for PUT request.
      const updateEndpoint = `/api/articles/${documentId}`;
      await performStrapiRequest(updateEndpoint, {
          method: 'PUT',
          body: JSON.stringify(payload),
      });

      console.log(`[SAVE_ARTICLE_ACTION] Successfully updated article with documentId ${documentId}.`);

    } else {
      console.log('[SAVE_ARTICLE_ACTION] Creating new article.');
      await performStrapiRequest('/api/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    console.log('[SAVE_ARTICLE_ACTION] Revalidating paths.');
    revalidatePath('/admin/articles');
    revalidatePath(`/articulos/${slug}`);
    revalidatePath('/');

    return {
      message: `Artículo ${documentId ? 'actualizado' : 'creado'} con éxito.`,
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
        const deleteEndpoint = `/api/articles/${documentId}`;
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
