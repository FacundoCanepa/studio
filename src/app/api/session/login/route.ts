import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  loginSchema,
  createSessionCookie,
  mapStrapiError,
} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {error: validated.error.flatten().fieldErrors},
        {status: 400}
      );
    }

    // 2. Proxy login request to Strapi
    const strapiRes = await fetch(`${API_BASE}/auth/local`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      const {status, message} = mapStrapiError(strapiData);
      return NextResponse.json({error: message}, {status});
    }

    const {jwt, user} = strapiData;

    // 3. Create session cookie and send response
    const cookie = createSessionCookie(jwt);
    const response = NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_LOGIN_ERROR]', error);
    return NextResponse.json(
      {error: 'Ocurrió un error en el servidor.'},
      {status: 500}
    );
  }
}
