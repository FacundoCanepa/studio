import {NextResponse} from 'next/server';
import {createCsrfToken, createCsrfCookie} from '@/lib/api/csrf';

// This endpoint generates a CSRF token and sets it as a cookie.
// The client-side code should call this endpoint to get the token
// and then include it in the 'x-csrf-token' header for all mutating requests.
export async function GET() {
  try {
    const csrfToken = await createCsrfToken();
    const cookie = createCsrfCookie(csrfToken);

    const response = NextResponse.json({csrfToken});
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_CSRF_ERROR]', error);
    return NextResponse.json(
      {error: 'Failed to generate CSRF token.'},
      {status: 500}
    );
  }
}
