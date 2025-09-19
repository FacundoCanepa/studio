import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: Request) {
  if (!STRAPI_URL) {
    return NextResponse.json(
      {
        error: 'La variable de entorno NEXT_PUBLIC_STRAPI_URL no está configurada.',
      },
      { status: 500 }
    );
  }

  if (!STRAPI_API_TOKEN) {
    return NextResponse.json(
      {
        error: 'La variable de entorno STRAPI_API_TOKEN no está configurada en el servidor.',
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const hasFile = formData.has('files');

    if (!hasFile) {
      return NextResponse.json(
        {
          error: 'No se encontró ningún archivo en la solicitud.',
        },
        { status: 400 }
      );
    }

    const strapiResponse = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: formData,
      // Strapi maneja internamente el contenido multipart/form-data.
    });

    let parsedBody: unknown;
    let rawBody: string | undefined;

    try {
      parsedBody = await strapiResponse.json();
    } catch (error) {
      rawBody = await strapiResponse.text().catch(() => undefined);
      console.error('[STRAPI_UPLOAD_PARSE_ERROR]', {
        message: (error as Error)?.message,
        rawBody,
      });
    }

    if (!strapiResponse.ok) {
      return NextResponse.json(
        {
          error: 'Error al subir el archivo a Strapi.',
          details: parsedBody ?? rawBody ?? null,
        },
        { status: strapiResponse.status }
      );
    }

    if (!parsedBody) {
      return NextResponse.json(
        {
          error: 'Strapi no devolvió una respuesta válida.',
        },
        { status: 502 }
      );
    }

    const assets = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
    const firstAsset: any = assets[0];
    const assetId = firstAsset?.id;

    if (typeof assetId !== 'number') {
      return NextResponse.json(
        {
          error: 'No se pudo determinar el ID del recurso subido.',
          details: parsedBody,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: assetId,
      asset: firstAsset,
      assets,
    });
  } catch (error) {
    console.error('[STRAPI_UPLOAD_FORWARD_ERROR]', error);
    return NextResponse.json(
      {
        error: 'Ocurrió un error al reenviar la subida a Strapi.',
      },
      { status: 500 }
    );
  }
}