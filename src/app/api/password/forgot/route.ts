// src/app/api/password/forgot/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  forgotPasswordSchema,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';

/**
 * Proxies the "forgot password" request to Strapi.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = forgotPasswordSchema.safeParse(body);
    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    // 2. Proxy request to Strapi
    const strapiRes = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
    });

    // 3. Handle Strapi's response
    if (!strapiRes.ok) {
      // Strapi doesn't send a detailed error here for security,
      // so we rely on our generic mapping.
      const strapiData = await strapiRes.json().catch(() => null);
      return mapStrapiError(strapiData);
    }

    // 4. Return a generic success message to prevent user enumeration
    return NextResponse.json({
      ok: true,
      data: {
        message:
          'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      },
    });
  } catch (error) {
    console.error('[API_FORGOT_PASSWORD_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
