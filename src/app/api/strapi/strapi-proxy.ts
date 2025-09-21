import { NextResponse } from 'next/server';

export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export function missingStrapiUrlResponse() {
  return NextResponse.json(
    {
      error: 'La variable de entorno NEXT_PUBLIC_STRAPI_URL no está configurada.',
    },
    { status: 500 }
  );
}

function buildProxyHeaders(request: Request, method: string) {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  const authorization = request.headers.get('Authorization');
  if (authorization) {
    headers.set('Authorization', authorization);
  }

  if (!['GET', 'HEAD'].includes(method)) {
    const contentType = request.headers.get('Content-Type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
  }

  return headers;
}

async function readRequestBody(request: Request, method: string) {
  if (['GET', 'HEAD'].includes(method)) {
    return undefined;
  }

  try {
    const textBody = await request.text();
    return textBody.length > 0 ? textBody : undefined;
  } catch (error) {
    console.error('[STRAPI_PROXY_BODY_ERROR]', error);
    throw error;
  }
}

export async function parseStrapiResponse(strapiResponse: Response, context = 'STRAPI_PROXY') {
  let parsedBody: unknown;
  let rawBody: string | undefined;

  const responseClone = strapiResponse.clone();

  try {
    parsedBody = await strapiResponse.json();
  } catch (error) {
    rawBody = await responseClone.text().catch(() => undefined);
    console.error(`[${context}_PARSE_ERROR]`, {
      message: (error as Error)?.message,
      rawBody,
    });
  }

  if (parsedBody === undefined && rawBody && rawBody.trim().length > 0) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error(`[${context}_RAW_PARSE_ERROR]`, {
        message: (parseError as Error)?.message,
        rawBody,
      });
    }
  }

  return { parsedBody, rawBody };
}

function extractErrorMessage(parsedBody: unknown, rawBody?: string) {
  if (parsedBody && typeof parsedBody === 'object') {
    const body = parsedBody as Record<string, unknown>;
    const error = body.error as unknown;

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === 'string') {
        return message;
      }
    }

    const message = body.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  if (rawBody && rawBody.trim().length > 0) {
    return rawBody;
  }

  return 'Error al comunicarse con Strapi.';
}

export async function proxyStrapiRequest(
  request: Request,
  path: string,
  { context }: { context?: string } = {}
) {
  if (!STRAPI_URL) {
    return missingStrapiUrlResponse();
  }

  const method = request.method.toUpperCase();
  const headers = buildProxyHeaders(request, method);
  const url = new URL(request.url);
  const targetUrl = `${STRAPI_URL.replace(/\/$/, '')}/api/${path}${url.search}`;

  let body: string | undefined;
  try {
    body = await readRequestBody(request, method);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'No se pudo leer el cuerpo de la solicitud entrante.',
      },
      { status: 400 }
    );
  }

  try {
    const strapiResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    let { parsedBody, rawBody } = await parseStrapiResponse(strapiResponse, context ?? 'STRAPI_PROXY');

    if (!strapiResponse.ok) {
      const errorMessage = extractErrorMessage(parsedBody, rawBody);
      return NextResponse.json(
        {
          error: errorMessage,
          details: parsedBody ?? rawBody ?? null,
        },
        { status: strapiResponse.status }
      );
    }

    if (parsedBody === undefined) {
      if (rawBody && rawBody.trim().length > 0) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          return NextResponse.json(
            {
              error: 'Strapi no devolvió una respuesta JSON válida.',
              details: rawBody,
            },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: 'Strapi no devolvió una respuesta válida.',
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(parsedBody, { status: strapiResponse.status });
  } catch (error) {
    console.error(`[${context ?? 'STRAPI_PROXY'}_FORWARD_ERROR]`, error);
    return NextResponse.json(
      {
        error: 'Ocurrió un error al comunicarse con Strapi.',
      },
      { status: 500 }
    );
  }
}