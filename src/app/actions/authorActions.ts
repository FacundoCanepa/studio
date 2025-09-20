
'use server';

import { revalidatePath } from 'next/cache';
import { createAuthor, updateAuthor, deleteAuthor, AuthorPayload } from '@/lib/strapi-authors';
import { authorSchema, normalizeAuthorForm, AuthorFormData } from '@/lib/validation/author-schema';
import type { FormState } from './types';

/**
 * Server Action para guardar (crear o actualizar) un autor.
 */
export async function saveAuthorAction(
  documentId: string | null,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.log('[SAVE_AUTHOR_ACTION] Started for documentId:', documentId);
  
  const rawData = Object.fromEntries(formData.entries());
  
  const normalizedData = normalizeAuthorForm(rawData);
  
  const validation = authorSchema.safeParse(normalizedData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    console.error('[SAVE_AUTHOR_ACTION] Validation failed:', fieldErrors);
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: fieldErrors,
      success: false,
    };
  }
  
  console.log('[SAVE_AUTHOR_ACTION] Validation successful.');
  const { name, bio, pendingCoverId } = validation.data;

  const payload: Partial<AuthorPayload> = {
    Name: name,
    Bio: bio,
  };
  
  if (pendingCoverId !== undefined) {
      payload.Avatar = pendingCoverId === 'null' ? null : Number(pendingCoverId);
  }

  try {
    if (documentId) {
      console.log(`[SAVE_AUTHOR_ACTION] Updating author with documentId ${documentId}.`);
      await updateAuthor(documentId, payload);
    } else {
      console.log('[SAVE_AUTHOR_ACTION] Creating new author.');
      await createAuthor(payload as AuthorPayload);
    }

    console.log('[SAVE_AUTHOR_ACTION] Done. Revalidating paths.');
    revalidatePath('/admin/authors');
    if (documentId) {
      revalidatePath(`/admin/authors/edit/${documentId}`);
    }

    return {
      message: documentId ? 'Autor actualizado con éxito.' : 'Autor creado con éxito.',
      success: true,
    };
  } catch (error: any) {
    console.error('[SAVE_AUTHOR_ACTION] Error during Strapi operation:', error);
    const errorMessage = error.message || 'Ocurrió un error al guardar el autor.';
    return {
      message: errorMessage,
      success: false,
    };
  }
}

/**
 * Server Action para eliminar un autor.
 */
export async function deleteAuthorAction(documentId: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_AUTHOR_ACTION] Attempting to delete author with document ID: ${documentId}`);
    try {
        await deleteAuthor(documentId);
        
        console.log(`[DELETE_AUTHOR_ACTION] Successfully deleted author ${documentId}. Revalidating path.`);
        revalidatePath('/admin/authors');

        return { success: true, message: 'Autor eliminado con éxito.' };

    } catch (error: any) {
        console.error(`[DELETE_AUTHOR_ACTION] Exception caught for author document ID ${documentId}:`, error);
        return { success: false, message: `Error al eliminar: ${error.message}` };
    }
}
