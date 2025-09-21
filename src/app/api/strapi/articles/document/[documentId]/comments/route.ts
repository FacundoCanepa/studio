// src/app/api/strapi/articles/document/[documentId]/comments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { proxyStrapiRequest } from '../../../strapi-proxy';
import { qs } from '@/lib/qs';

export const dynamic = 'force-dynamic';

interface DocumentCommentsContext {
  params: { documentId: string };
}

// Esta ruta actúa como un proxy limpio y directo al endpoint personalizado de Strapi.
export async function GET(request: NextRequest, { params }: DocumentCommentsContext) {
  const { documentId } = params;
  
  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  // La ruta personalizada en Strapi es '/articles/document/:documentId/comments'
  // El proxyStrapiRequest ya añade el prefijo '/api/', por lo que no lo incluimos aquí.
  const strapiPath = `articles/document/${documentId}/comments`;

  // Pasamos el request completo al proxy para que maneje los searchParams (page, pageSize, etc.)
  // y la autenticación si fuera necesaria.
  return proxyStrapiRequest(request, strapiPath, { context: 'STRAPI_DOCUMENT_COMMENTS' });
}
