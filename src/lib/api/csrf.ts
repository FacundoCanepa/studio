import {SignJWT, jwtVerify} from 'jose';
import {type NextRequest} from 'next/server';
import {serialize, parse} from 'cookie';

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME!;
const CSRF_SECRET = new TextEncoder().encode(process.env.CSRF_SECRET!);

// --- CSRF Token Generation ---
export async function createCsrfToken() {
  const token = await new SignJWT({})
    .setProtectedHeader({alg: 'HS256'})
    .setIssuedAt()
    .setExpirationTime('1h') // Short-lived CSRF token
    .sign(CSRF_SECRET);
  return token;
}

// --- CSRF Cookie Serialization ---
export function createCsrfCookie(csrfToken: string) {
  return serialize(CSRF_COOKIE_NAME, csrfToken, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // This cookie is intentionally NOT httpOnly so the client can read it
  });
}

// --- CSRF Validation ---
export async function validateCsrf(request: NextRequest) {
  const csrfTokenFromHeader = request.headers.get('x-csrf-token');
  const cookies = parse(request.headers.get('cookie') ?? '');
  const csrfTokenFromCookie = cookies[CSRF_COOKIE_NAME];

  if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
    throw {status: 403, message: 'CSRF token missing.'};
  }

  if (csrfTokenFromHeader !== csrfTokenFromCookie) {
    throw {status: 403, message: 'CSRF token mismatch.'};
  }

  try {
    // Also verify the token signature to prevent tampering
    await jwtVerify(csrfTokenFromHeader, CSRF_SECRET);
  } catch (error) {
    throw {status: 403, message: 'Invalid CSRF token.'};
  }
}
