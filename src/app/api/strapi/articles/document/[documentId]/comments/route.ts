// src/app/api/strapi/articles/document/[documentId]/comments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { performStrapiRequest } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';

export const dynamic = 'force-dynamic';

interface DocumentCommentsContext {
  params: { documentId: string };
}

// Esta ruta actúa como un proxy limpio y directo al endpoint personalizado de Strapi.
export async function GET(request: NextRequest, { params }: DocumentCommentsContext) {
  const { documentId } = params;
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '10';

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  // Construimos la ruta tal como la espera el controlador personalizado de Strapi
  const strapiPath = `/api/articles/document/${documentId}/comments`;

  const query = {
    page,
    pageSize,
  };
  const queryString = qs(query);

  try {
    // Usamos performStrapiRequest que maneja la autenticación y el fetch
    const response = await performStrapiRequest(`${strapiPath}${queryString}`, {
        method: 'GET',
        cache: 'no-store',
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error(`[PROXY_ERROR] /comments: Failed to fetch from Strapi for documentId ${documentId}`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments from Strapi' },
      { status: error.status || 500 }
    );
  }
}
