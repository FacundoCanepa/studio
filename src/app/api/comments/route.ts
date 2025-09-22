import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { fetchStrapi } from '@/lib/strapi-api';
import {
  COMMENTS_TAG,
  buildCommentsQuery,
  buildCommentsTag,
  normalizeCommentsResponse,
  normalizeSingleComment,
  type StrapiCommentsResponse,
} from '@/lib/strapi-comments';
import { getJwtFromCookie } from '@/lib/api-utils';
import {
  forwardToStrapi,
  handleStrapiResponse,
  readJsonBody,
} from '@/app/api/comments/utils';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export const revalidate = 60;


const querySchema = z.object({
  documentId: z
    .string()
    .trim()
    .min(1, 'documentId es requerido.'),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE, `pageSize no puede ser mayor a ${MAX_PAGE_SIZE}.`)
    .optional(),
});

const positiveInt = z.coerce.number().int().positive();

const parentIdSchema = z
  .union([positiveInt, z.literal(null), z.undefined()])
  .transform((value) => (value == null ? undefined : value));

const createBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'El contenido es requerido.')
    .max(2000, 'El comentario es demasiado largo.'),
  articleId: positiveInt,
  articleDocumentId: z
    .string()
    .trim()
    .min(1, 'articleDocumentId es requerido.'),
  parentId: parentIdSchema,
});

function successResponse<T>(data: T, meta?: unknown, init?: ResponseInit) {
  return NextResponse.json(
    meta ? { ok: true, data, meta } : { ok: true, data },
    init,
  );
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

export async function GET(request: NextRequest) {
  const params = {
    documentId: request.nextUrl.searchParams.get('documentId'),
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
  };

  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message);
    return errorResponse(400, 'validation_error', 'Parámetros inválidos.', details);
  }

  const { documentId } = parsed.data;
  const page = parsed.data.page ?? DEFAULT_PAGE;
  const pageSize = parsed.data.pageSize ?? DEFAULT_PAGE_SIZE;

  // Use a query that does not populate 'author'
 // Reutilizamos el builder centralizado que ya no incluye populate[author].
 const query = buildCommentsQuery(documentId, page, pageSize);
 console.info('[COMMENTS_ROUTE_GET]', {
   documentId,
   page,
   pageSize,
   query,
  });


  try {
    const strapiResponse = await fetchStrapi<StrapiCommentsResponse>(
      `/api/comments${query}`,
      {
        next: {
          revalidate,
          tags: [COMMENTS_TAG, buildCommentsTag(documentId)],
        },
      },
    );

    const { comments, pagination } = normalizeCommentsResponse(strapiResponse, {
      page,
      pageSize,
    });
    
    console.info('[COMMENTS_ROUTE_GET_SUCCESS]', {
      documentId,
      page,
      pageSize,
      strapiStatus: 'ok',
      returned: comments.length,
    });
    return successResponse(comments, { pagination });
  } catch (error) {
    console.error('[COMMENTS_GET_ERROR]', error);
    return errorResponse(
      502,
      'strapi_error',
      'No se pudieron obtener los comentarios en este momento.',
    );
  }
}

export async function POST(request: NextRequest) {
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

  const parsed = createBodySchema.safeParse(body as Record<string, unknown>);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message);
    return errorResponse(400, 'validation_error', 'Datos inválidos.', details);
  }

  const { content, articleId, articleDocumentId, parentId } = parsed.data;

  try {
    const response = await forwardToStrapi(
      `/comments`, // No populate needed on create
      token,
      {
        method: 'POST',
        body: {
          data: {
            content,
            article: articleId,
            ...(parentId ? { parent: parentId } : {}),
          },
        },
      },
    );

    const payload = await handleStrapiResponse(
      response,
      'No se pudo crear el comentario.',
    );

    const normalized = normalizeSingleComment(payload);
    const documentTagId =
      normalized.articleDocumentId ?? articleDocumentId;

    await revalidateTag(COMMENTS_TAG);
    if (documentTagId) {
      await revalidateTag(buildCommentsTag(documentTagId));
    }

    return successResponse(normalized.comment);
  } catch (error) {
    console.error('[COMMENTS_CREATE_ERROR]', error);
    const message = (error as Error).message;
    const status = message.includes('configurado') ? 500 : 400;
    return errorResponse(status, 'create_failed', message);
  }
}
