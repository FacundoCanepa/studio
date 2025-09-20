'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { performStrapiRequest } from '@/lib/strapi-api';

const gallerySchema = z.object({
  Famoso: z.string().min(1, 'El nombre del famoso es requerido.'),
  Nota: z.string().min(1, 'La nota es requerida.'),
  pendingCoverId: z.string().optional(),
});

type FormState = {
  message: string;
  errors?: Record<string, string[]>;
  success: boolean;
};

export async function saveGalleryItemAction(
  documentId: string | null,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.log('[SAVE_GALLERY_ITEM_ACTION] Started for documentId:', documentId);

  const rawData = Object.fromEntries(formData.entries());

  const validation = gallerySchema.safeParse(rawData);

  if (!validation.success) {
    console.error('[SAVE_GALLERY_ITEM_ACTION] Validation failed:', validation.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }

  console.log('[SAVE_GALLERY_ITEM_ACTION] Validation successful.');

  const { Famoso, Nota, pendingCoverId } = validation.data;

  const payload: Record<string, any> = {
    Famoso,
    Nota,
  };

  if (pendingCoverId !== undefined) {
    const imageId = pendingCoverId === 'null' ? null : Number(pendingCoverId);
    payload.Imagen = imageId;
  }

  try {
    if (documentId) {
      console.log(`[SAVE_GALLERY_ITEM_ACTION] Updating gallery item with documentId ${documentId}.`);
      await performStrapiRequest(`/api/Galerias/${documentId}`, {
        method: 'PUT',
        body: { data: payload },
      });
    } else {
      console.log('[SAVE_GALLERY_ITEM_ACTION] Creating new gallery item.');
      await performStrapiRequest('/api/Galerias', {
        method: 'POST',
        body: { data: payload },
      });
    }

    revalidatePath('/admin/galeria');
    if (documentId) {
      revalidatePath(`/admin/galeria/edit/${documentId}`);
    }

    return {
      message: documentId ? 'Elemento de galería actualizado con éxito.' : 'Elemento de galería creado con éxito.',
      success: true,
    };
  } catch (error: any) {
    console.error('[SAVE_GALLERY_ITEM_ACTION] Error during Strapi operation:', error);
    const errorMessage = error.message || 'Error al guardar el elemento de la galería.';
    return {
      message: errorMessage,
      success: false,
    };
  }
}

export async function deleteGalleryItemAction(documentId: string): Promise<{ success: boolean; message: string }> {
  console.log(`[DELETE_GALLERY_ITEM_ACTION] Attempting to delete gallery item with document ID: ${documentId}`);
  try {
    await performStrapiRequest(`/api/Galerias/${documentId}`, { method: 'DELETE' });
    console.log(`[DELETE_GALLERY_ITEM_ACTION] Successfully deleted gallery item ${documentId}.`);
    revalidatePath('/admin/galeria');
    return { success: true, message: 'Elemento de galería eliminado con éxito.' };
  } catch (error: any) {
    console.error(`[DELETE_GALLERY_ITEM_ACTION] Exception caught for gallery item document ID ${documentId}:`, error);
    return { success: false, message: `Error al eliminar: ${error.message}` };
  }
}
