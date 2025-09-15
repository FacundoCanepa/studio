import {NextResponse, type NextRequest} from 'next/server';
import {API_BASE, registerSchema, mapStrapiError} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {error: validated.error.flatten().fieldErrors},
        {status: 400}
      );
    }

    // 2. Proxy register request to Strapi
    const strapiRes = await fetch(`${API_BASE}/auth/local/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      const {status, message} = mapStrapiError(strapiData);
      return NextResponse.json({error: message}, {status});
    }

    // 3. Check if email confirmation is required
    if (strapiData.user && !strapiData.jwt) {
      return NextResponse.json({
        message: 'Revisá tu correo para confirmar tu cuenta.',
      });
    }

    // This part would handle auto-login, but we respect Strapi's flow
    // If JWT is present, user is confirmed. For now, we ask them to log in.
    return NextResponse.json({
      message:
        'Registro exitoso. Por favor, inicia sesión.',
    });
  } catch (error) {
    console.error('[API_REGISTER_ERROR]', error);
    return NextResponse.json(
      {error: 'Ocurrió un error en el servidor.'},
      {status: 500}
    );
  }
}
