import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import {
  COMMENTS_TAG,
  buildCommentsTag,
  normalizeSingleComment,
} from '@/lib/strapi-comments';
import { getJwtFromCookie } from '@/lib/api-utils';
import {
  forwardToStrapi,
  handleStrapiResponse,
  readJsonBody,
} from '@/app/api/comments/utils';

const positiveInt = z.coerce.number().int().positive();

const paramsSchema = z.object({
  commentId: positiveInt,
});

const updateBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'El contenido es requerido.')
    .max(2000, 'El comentario es demasiado largo.'),
  articleDocumentId: z
    .string()
    .trim()
    .min(1, 'articleDocumentId es requerido.'),
});

const deleteBodySchema = z.object({
  articleDocumentId: z
    .string()
    .trim()
    .min(1, 'articleDocumentId es requerido.'),
});

function successResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

function successEmpty(init?: ResponseInit) {
  return NextResponse.json({ ok: true }, init);
}

function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

function extractArticleDocumentId(
  normalized: { articleDocumentId: string | null },
  fallback?: string,
): string | null {
  if (normalized.articleDocumentId) {
    return normalized.articleDocumentId;
  }
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }
  return null;
}

export async function PUT(request: NextRequest, context: { params: { commentId: string } }) {
  const paramsParsed = paramsSchema.safeParse({ commentId: context.params.commentId });
  if (!paramsParsed.success) {
    return errorResponse(400, 'validation_error', 'Parámetros inválidos.');
  }

  const commentId = paramsParsed.data.commentId;

  const token = await getJwtFromCookie(request);
  if (!token) {
    return errorResponse(401, 'unauthorized', 'No autenticado.');
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return errorResponse(400, 'invalid_body', (error as Error).message);
  }

  const parsedBody = updateBodySchema.safeParse({
    ...(body as Record<string, unknown>),
  });

  if (!parsedBody.success) {
    const details = parsedBody.error.issues.map((issue) => issue.message);
    return errorResponse(400, 'validation_error', 'Datos inválidos.', details);
  }

  try {
    const response = await forwardToStrapi(
      `/comments/${commentId}?populate[article][fields][0]=documentId`,
      token,
      {
        method: 'PUT',
        body: {
          data: {
            content: parsedBody.data.content,
          },
        },
      },
    );

    const payload = await handleStrapiResponse(
      response,
      'No se pudo actualizar el comentario.',
    );

    const normalized = normalizeSingleComment(payload);
    const articleDocumentId = extractArticleDocumentId(
      normalized,
      parsedBody.data.articleDocumentId,
    );

    await revalidateTag(COMMENTS_TAG);
    if (articleDocumentId) {
      await revalidateTag(buildCommentsTag(articleDocumentId));
    }

    return successResponse(normalized.comment);
  } catch (error) {
    console.error('[COMMENTS_UPDATE_ERROR]', error);
    const message = (error as Error).message;
    const status = message.includes('configurado') ? 500 : 400;
    return errorResponse(status, 'update_failed', message);
  }
}

export async function DELETE(request: NextRequest, context: { params: { commentId: string } }) {
  const paramsParsed = paramsSchema.safeParse({ commentId: context.params.commentId });
  if (!paramsParsed.success) {
    return errorResponse(400, 'validation_error', 'Parámetros inválidos.');
  }

  const commentId = paramsParsed.data.commentId;

  const token = await getJwtFromCookie(request);
  if (!token) {
    return errorResponse(401, 'unauthorized', 'No autenticado.');
  }

  let body: unknown = {};
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return errorResponse(400, 'invalid_body', (error as Error).message);
  }

  const parsedBody = deleteBodySchema.safeParse({
    ...(body as Record<string, unknown>),
  });

  if (!parsedBody.success) {
    const details = parsedBody.error.issues.map((issue) => issue.message);
    return errorResponse(400, 'validation_error', 'Datos inválidos.', details);
  }

  try {
    const response = await forwardToStrapi(
      `/comments/${commentId}?populate[article][fields][0]=documentId`,
      token,
      {
        method: 'DELETE',
      },
    );

    if (response.status === 204) {
      await revalidateTag(COMMENTS_TAG);
      await revalidateTag(buildCommentsTag(parsedBody.data.articleDocumentId));
      return successEmpty();
    }

    const payload = await handleStrapiResponse(
      response,
      'No se pudo eliminar el comentario.',
    );

    const normalized = normalizeSingleComment(payload);
    const articleDocumentId = extractArticleDocumentId(
      normalized,
      parsedBody.data.articleDocumentId,
    );

    await revalidateTag(COMMENTS_TAG);
    if (articleDocumentId) {
      await revalidateTag(buildCommentsTag(articleDocumentId));
    }

    return successEmpty();
  } catch (error) {
    console.error('[COMMENTS_DELETE_ERROR]', error);
    const message = (error as Error).message;
    const status = message.includes('configurado') ? 500 : 400;
    return errorResponse(status, 'delete_failed', message);
  }
}
