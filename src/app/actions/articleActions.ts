

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_URL || !STRAPI_TOKEN) {
  throw new Error('STRAPI_URL and STRAPI_API_TOKEN must be configured.');
}

// Zod schema for article validation
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
  // New fields
  urlYoutube: z.string().optional(),
  contentMore: z.string().optional(),
  home: z.boolean().default(false),
  isNew: z.boolean().default(false),
  tendencias: z.boolean().default(false),
  // SEO fields
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
});

type FormState = {
  message: string;
  errors?: Record<string, string[]>;
  success: boolean;
};

async function performStrapiRequest(endpoint: string, options: RequestInit) {
  const url = `${STRAPI_URL}${endpoint}`;
  console.log(`[STRAPI_REQUEST] Performing request to: ${url}`, { method: options.method });
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`[STRAPI_ERROR] URL: ${url}, Status: ${response.status}`, JSON.stringify(errorBody, null, 2));
    throw new Error(
      errorBody.error?.message || `Error en la operación de Strapi: ${response.statusText}`
    );
  }
  
  const responseData = await response.json();
  console.log(`[STRAPI_SUCCESS] Successfully performed request to: ${url}`);
  return responseData;
}

export async function saveArticleAction(
  documentId: string | null,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.log('[SAVE_ARTICLE_ACTION] Started.', { documentId });
  const rawData = Object.fromEntries(formData.entries());
  console.log('[SAVE_ARTICLE_ACTION] Raw form data:', rawData);

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
    
  // Convert tags from names to IDs, creating them if they don't exist
  let tagIds: number[] = [];
  if (tags && tags.length > 0) {
      console.log('[SAVE_ARTICLE_ACTION] Processing tags:', tags);
      const allTagsResponse = await performStrapiRequest('/api/tags', { method: 'GET' });
      const existingTags: { id: number, attributes: { name: string } }[] = allTagsResponse.data;
      console.log('[SAVE_ARTICLE_ACTION] Existing tags from Strapi:', existingTags.map(t => t.attributes.name));

      for (const tagName of tags) {
          const existingTag = existingTags.find(t => t.attributes.name.toLowerCase() === tagName.toLowerCase());
          if (existingTag) {
              tagIds.push(existingTag.id);
              console.log(`[SAVE_ARTICLE_ACTION] Found existing tag '${tagName}' with ID ${existingTag.id}`);
          } else {
              // Create new tag
              console.log(`[SAVE_ARTICLE_ACTION] Tag '${tagName}' not found. Creating new tag.`);
              const newTagResponse = await performStrapiRequest('/api/tags', {
                  method: 'POST',
                  body: JSON.stringify({ data: { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') } }),
              });
              if (newTagResponse.data) {
                  tagIds.push(newTagResponse.data.id);
                  console.log(`[SAVE_ARTICLE_ACTION] Created new tag '${tagName}' with ID ${newTagResponse.data.id}`);
              } else {
                  console.error(`[SAVE_ARTICLE_ACTION] Failed to create new tag '${tagName}'`);
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
      publishedAt: publishedAt || null, // Strapi accepts null to unpublish
      tags: tagIds,
      UrlYoutube: urlYoutube,
      ContentMore: contentMore,
      home: home,
      New: isNew, // Field name in Strapi is 'New'
      Tendencias: tendencias,
      // SEO component is named 'Name' in your Strapi setup
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
      // Use the documentId to find the numeric ID first
      const articleToUpdate = await performStrapiRequest(`/api/articles?filters[documentId][$eq]=${documentId}`, { method: 'GET' });
      if (!articleToUpdate.data || articleToUpdate.data.length === 0) {
        throw new Error(`No se encontró el artículo con documentId ${documentId}`);
      }
      const numericId = articleToUpdate.data[0].id;
      console.log(`[SAVE_ARTICLE_ACTION] Found numeric ID ${numericId} for documentId ${documentId}. Updating.`);
      
      await performStrapiRequest(`/api/articles/${numericId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
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
        // First, find the numeric ID from the documentId
        const articleToDelete = await performStrapiRequest(`/api/articles?filters[documentId][$eq]=${documentId}`, { method: 'GET' });
        if (!articleToDelete.data || articleToDelete.data.length === 0) {
            throw new Error(`No se encontró el artículo con documentId ${documentId}`);
        }
        const numericId = articleToDelete.data[0].id;
        console.log(`[DELETE_ARTICLE_ACTION] Found numeric ID ${numericId} for documentId ${documentId}. Deleting.`);

        await performStrapiRequest(`/api/articles/${numericId}`, { method: 'DELETE' });
        
        console.log(`[DELETE_ARTICLE_ACTION] Successfully deleted article ${documentId}. Revalidating paths.`);
        revalidatePath('/admin/articles');
        revalidatePath('/');

        return { success: true, message: 'Artículo eliminado con éxito.' };

    } catch (error: any) {
        console.error(`[DELETE_ARTICLE_ACTION] Exception caught for article document ID ${documentId}:`, error);
        return { success: false, message: error.message };
    }
}
