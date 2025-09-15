// src/app/api/password/reset/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  resetPasswordSchema,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';

/**
 * Proxies the "reset password" request to Strapi.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = resetPasswordSchema.safeParse(body);
    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    // 2. Proxy request to Strapi
    const strapiRes = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
    });

    // 3. Handle Strapi's response
    if (!strapiRes.ok) {
      const strapiData = await strapiRes.json().catch(() => null);
      return mapStrapiError(strapiData);
    }

    // 4. Return success response
    return NextResponse.json({
      ok: true,
      data: {message: 'Contraseña actualizada con éxito.'},
    });
  } catch (error) {
    console.error('[API_RESET_PASSWORD_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
