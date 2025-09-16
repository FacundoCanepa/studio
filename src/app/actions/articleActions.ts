
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { API_BASE } from '@/lib/api-utils';

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
});

type FormState = {
  message: string;
  errors?: Record<string, string[]>;
  success: boolean;
};

async function performStrapiRequest(endpoint: string, options: RequestInit) {
  const url = `${STRAPI_URL}${endpoint}`;
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
    console.error(`[STRAPI_ERROR] URL: ${url}, Status: ${response.status}`, errorBody);
    throw new Error(
      errorBody.error?.message || `Error en la operación de Strapi: ${response.statusText}`
    );
  }

  return response.json();
}

export async function saveArticleAction(
  id: string | null,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());

  const dataToValidate = {
    ...rawData,
    featured: rawData.featured === 'on',
    tags: formData.getAll('tags'),
    category: rawData.category || '',
    author: rawData.author || '',
  };

  const validation = articleSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { title, slug, excerpt, content, category, author, featured, publishedAt, tags } =
    validation.data;
    
  // Convert tags from names to IDs, creating them if they don't exist
  let tagIds: number[] = [];
  if (tags && tags.length > 0) {
      const allTagsResponse = await performStrapiRequest('/api/tags', { method: 'GET' });
      const existingTags: { id: number, name: string }[] = allTagsResponse.data.map((t: any) => ({ id: t.id, name: t.attributes.name }));

      for (const tagName of tags) {
          const existingTag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
          if (existingTag) {
              tagIds.push(existingTag.id);
          } else {
              // Create new tag
              const newTagResponse = await performStrapiRequest('/api/tags', {
                  method: 'POST',
                  body: JSON.stringify({ data: { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') } }),
              });
              if (newTagResponse.data) {
                  tagIds.push(newTagResponse.data.id);
              }
          }
      }
  }


  const payload = {
    data: {
      title,
      slug,
      excerpt,
      Content: content,
      category: Number(category),
      author: Number(author),
      featured,
      publishedAt: publishedAt || null, // Strapi accepts null to unpublish
      tags: tagIds,
    },
  };

  try {
    if (id) {
      // Update existing article
      await performStrapiRequest(`/api/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      // Create new article
      await performStrapiRequest('/api/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    // Revalidate paths to reflect changes
    revalidatePath('/admin/articles');
    revalidatePath(`/articulos/${slug}`);
    revalidatePath('/');

    return {
      message: `Artículo ${id ? 'actualizado' : 'creado'} con éxito.`,
      success: true,
    };
  } catch (error: any) {
    return {
      message: `Error al guardar el artículo: ${error.message}`,
      success: false,
    };
  }
}

export async function deleteArticleAction(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${STRAPI_URL}/api/articles/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error?.message || 'No se pudo eliminar el artículo.');
        }
        
        revalidatePath('/admin/articles');
        revalidatePath('/');

        return { success: true, message: 'Artículo eliminado con éxito.' };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
