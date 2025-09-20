'use server';

import { revalidatePath } from 'next/cache';
import { createAuthor, updateAuthor, deleteAuthor, AuthorPayload, StrapiRichTextBlock } from '@/lib/strapi-authors';
import { authorSchema, normalizeAuthorForm, AuthorFormData } from '@/lib/validation/author-schema';
import type { FormState } from './types';

/**
 * Server Action para guardar (crear o actualizar) un autor.
 */
function convertTextToRichTextBlocks(text: string | undefined): AuthorPayload['Bio'] | undefined {
  if (text === undefined) {
    return undefined;
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const paragraphs = trimmed
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return [];
  }

  const blocks: StrapiRichTextBlock[] = paragraphs.map((paragraph) => ({
    type: 'paragraph',
    children: [
      {
        type: 'text',
        text: paragraph,
      },
    ],
  }));

  return blocks;
}

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
  };

  const richTextBio = convertTextToRichTextBlocks(bio);
  if (richTextBio !== undefined) {
    payload.Bio = richTextBio;
  }
  
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
  }  catch (error: unknown) {
    console.error('[SAVE_AUTHOR_ACTION] Error saving author:', error);
    return {
      message:
        'Ocurrió un error al guardar el autor. Por favor, inténtalo de nuevo más tarde.',
      success: false,
    };
  }
}