// src/lib/api/csrf.ts
import {SignJWT, jwtVerify} from 'jose';
import {type NextRequest} from 'next/server';
import {serialize, parse} from 'cookie';
import {respondWithError} from '../api-utils';

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME!;
const CSRF_SECRET = new TextEncoder().encode(process.env.CSRF_SECRET!);

if (!CSRF_COOKIE_NAME || !process.env.CSRF_SECRET) {
  throw new Error(
    'CSRF_COOKIE_NAME and CSRF_SECRET must be defined in .env'
  );
}

// --- CSRF Token Generation ---
export async function createCsrfToken() {
  const token = await new SignJWT({})
    .setProtectedHeader({alg: 'HS256'})
    .setIssuedAt()
    .setExpirationTime('1h') // Token valid for 1 hour
    .sign(CSRF_SECRET);
  return token;
}

// --- CSRF Cookie Serialization ---
// The CSRF cookie is NOT HttpOnly, allowing the client-side JS to read it and send it in a header.
// This is safe because only our frontend domain can read it.
export function createCsrfCookie(csrfToken: string) {
  return serialize(CSRF_COOKIE_NAME, csrfToken, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600, // 1 hour
    // This cookie is intentionally NOT httpOnly
  });
}

// --- CSRF Validation Middleware Logic ---
export async function validateCsrf(request: NextRequest) {
  const csrfTokenFromHeader = request.headers.get('x-csrf-token');
  const cookies = parse(request.headers.get('cookie') ?? '');
  const csrfTokenFromCookie = cookies[CSRF_COOKIE_NAME];
  
  if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
    return respondWithError('csrf_token_missing');
  }

  if (csrfTokenFromHeader !== csrfTokenFromCookie) {
    return respondWithError('csrf_token_mismatch');
  }

  try {
    // Also verify the token signature and expiration to prevent tampering
    await jwtVerify(csrfTokenFromHeader, CSRF_SECRET);
  } catch (error) {
    return respondWithError('csrf_token_invalid');
  }

  // If all checks pass, return null to indicate success
  return null;
}
