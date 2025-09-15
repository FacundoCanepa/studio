import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  forgotPasswordSchema,
  mapStrapiError,
} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {error: validated.error.flatten().fieldErrors},
        {status: 400}
      );
    }

    const strapiRes = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
    });

    if (!strapiRes.ok) {
      const strapiData = await strapiRes.json();
      const {status, message} = mapStrapiError(strapiData);
      return NextResponse.json({error: message}, {status});
    }

    return NextResponse.json({
      message:
        'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error('[API_FORGOT_PASSWORD_ERROR]', error);
    return NextResponse.json(
      {error: 'Ocurrió un error en el servidor.'},
      {status: 500}
    );
  }
}
