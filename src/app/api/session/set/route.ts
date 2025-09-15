import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  setSessionSchema,
  createSessionCookie,
  mapStrapiError,
} from '@/lib/api-utils';

// This endpoint is called by the frontend after a successful social login redirect
// The frontend extracts the access_token from the URL and sends it here.
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = setSessionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {error: validated.error.flatten().fieldErrors},
        {status: 400}
      );
    }

    const {token} = validated.data;

    // 2. Verify token by fetching user data from Strapi
    const strapiRes = await fetch(`${API_BASE}/users/me`, {
      headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store',
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      const {status, message} = mapStrapiError(strapiData);
      return NextResponse.json({error: message}, {status: status || 401});
    }

    // 3. Create session cookie and send sanitized user response
    const cookie = createSessionCookie(token);
    const response = NextResponse.json({
      id: strapiData.id,
      username: strapiData.username,
      email: strapiData.email,
    });
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_SESSION_SET_ERROR]', error);
    return NextResponse.json(
      {error: 'Ocurrió un error en el servidor.'},
      {status: 500}
    );
  }
}
