'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { performStrapiRequest } from '@/lib/strapi-api';
import { toStrapiSlug } from '@/lib/strapiSlug';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  slug: z.string().min(1, 'El slug es requerido.'),
});

type FormState = {
  message: string;
  errors?: Record<string, string[]>;
  success: boolean;
};

export async function saveCategoryAction(
  documentId: string | null,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.log('[SAVE_CATEGORY_ACTION] Started for documentId:', documentId);

  const rawData = Object.fromEntries(formData.entries());
  
  const validation = categorySchema.safeParse(rawData);

  if (!validation.success) {
    console.error('[SAVE_CATEGORY_ACTION] Validation failed:', validation.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }

  const payload = validation.data;

  const sanitizedName = payload.name.trim();
  const sanitizedSlug = toStrapiSlug(payload.slug.trim());

  const postValidationErrors: Record<string, string[]> = {};

  if (!sanitizedName) {
    postValidationErrors.name = ['El nombre es requerido.'];
  }

  if (!sanitizedSlug) {
    postValidationErrors.slug = ['El slug es requerido.'];
  }

  if (Object.keys(postValidationErrors).length > 0) {
    console.error('[SAVE_CATEGORY_ACTION] Sanitization failed:', postValidationErrors);
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: postValidationErrors,
      success: false,
    };
  }

  const rawImgValue = formData.get('imgId') ?? formData.get('img');
  let imgId: number | string | undefined;

  if (typeof rawImgValue === 'string') {
    const trimmedImg = rawImgValue.trim();
    if (trimmedImg) {
      if (/^\d+$/.test(trimmedImg)) {
        imgId = Number.parseInt(trimmedImg, 10);
      } else {
        imgId = trimmedImg;
      }
    }
  }

  const strapiPayload = {
    name: sanitizedName,
    slug: sanitizedSlug,
    ...(imgId !== undefined ? { img: imgId } : {}),
  };

  console.log('[SAVE_CATEGORY_ACTION] Validation successful. Payload:', strapiPayload);

  try {
    let resultingDocumentId = documentId;

    if (documentId) {
      console.log(`[SAVE_CATEGORY_ACTION] Updating category with documentId ${documentId}.`);
      await performStrapiRequest(`/api/categories/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: strapiPayload }),
      });
    } else {
      console.log('[SAVE_CATEGORY_ACTION] Creating new category.');
      const response = await performStrapiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ data: strapiPayload }),
      });
      resultingDocumentId = response.data?.documentId;
      console.log(`[SAVE_CATEGORY_ACTION] Created new category with documentId ${resultingDocumentId}.`);
    }

    revalidatePath('/admin/categories');
    if (resultingDocumentId) {
      revalidatePath(`/admin/categories/edit/${resultingDocumentId}`);
    }

    return {
      message: documentId ? 'Categoría actualizada con éxito.' : 'Categoría creada con éxito.',
      success: true,
    };
  } catch (error: any) {
    console.error('[SAVE_CATEGORY_ACTION] Error during Strapi operation:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Error desconocido.';
    return {
      message: `Error al guardar la categoría: ${errorMessage}`,
      success: false,
    };
  }
}


export async function deleteCategoryAction(documentId: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_CATEGORY_ACTION] Attempting to delete category with document ID: ${documentId}`);
    try {
        const response = await performStrapiRequest(`/api/categories/${documentId}`, { method: 'DELETE' });

        if (response.error) {
            throw new Error(response.error.message);
        }

        console.log(`[DELETE_CATEGORY_ACTION] Successfully deleted category ${documentId}.`);
        revalidatePath('/admin/categories');

        return { success: true, message: 'Categoría eliminada con éxito.' };

    } catch (error: any) {
        console.error(`[DELETE_CATEGORY_ACTION] Exception caught for category document ID ${documentId}:`, error);
        return { success: false, message: `Error al eliminar: ${error.message}` };
    }
}
