import {NextResponse, type NextRequest} from 'next/server';
import {API_BASE, mapStrapiError} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Get token from HttpOnly cookie
    const token = request.cookies.get(process.env.COOKIE_NAME!)?.value;

    if (!token) {
      return NextResponse.json({error: 'No autenticado.'}, {status: 401});
    }

    // 2. Fetch user data from Strapi using the token
    const strapiRes = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      const {status, message} = mapStrapiError(strapiData);
      return NextResponse.json({error: message}, {status});
    }

    // 3. Return sanitized user data
    return NextResponse.json({
      id: strapiData.id,
      username: strapiData.username,
      email: strapiData.email,
    });
  } catch (error) {
    console.error('[API_ME_ERROR]', error);
    return NextResponse.json(
      {error: 'Ocurrió un error en el servidor.'},
      {status: 500}
    );
  }
}
