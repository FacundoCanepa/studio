// src/app/api/session/register/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  registerSchema,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';

/**
 * Handles user registration by proxying data to Strapi.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    // 2. Proxy register request to Strapi
    const strapiRes = await fetch(`${API_BASE}/auth/local/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      return mapStrapiError(strapiData);
    }

    // 3. Check if email confirmation is required by Strapi
    // Strapi returns a user object but no JWT if confirmation is pending.
    if (strapiData.user && !strapiData.jwt) {
      return NextResponse.json({
        ok: true,
        data: {
          message: 'Revisá tu correo para confirmar tu cuenta.',
          requiresConfirmation: true,
        },
      });
    }

    // If a JWT is present, Strapi has auto-confirmed the user.
    // We don't auto-login them to keep the flow simple.
    return NextResponse.json({
      ok: true,
      data: {
        message: 'Registro exitoso. Por favor, inicia sesión.',
        requiresConfirmation: false,
      },
    });
  } catch (error) {
    console.error('[API_REGISTER_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
