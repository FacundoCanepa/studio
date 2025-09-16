
// src/app/api/password/forgot/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  forgotPasswordSchema,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';
import { validateCsrf } from '@/lib/api/csrf';

export async function POST(request: NextRequest) {
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.safeParse(body);
    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    const strapiRes = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
    });

    if (!strapiRes.ok) {
      const strapiData = await strapiRes.json().catch(() => null);
      return mapStrapiError(strapiData);
    }

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
