// src/lib/api-utils.ts
import {z} from 'zod';
import {serialize, parse} from 'cookie';
import {type NextRequest, NextResponse} from 'next/server';
import {SignJWT, jwtVerify} from 'jose';

// --- Environment Variable Validation ---
const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const API_BASE = `${requiredEnv('STRAPI_URL')}/api`;
const COOKIE_NAME = requiredEnv('COOKIE_NAME');
const COOKIE_SECRET = new TextEncoder().encode(requiredEnv('COOKIE_SECRET'));
const COOKIE_TTL_DAYS = parseInt(requiredEnv('COOKIE_TTL_DAYS'), 10);

// --- Zod Schemas for Input Validation ---
export const loginSchema = z.object({
  identifier: z.string().email('Email inválido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres.'),
  email: z.string().email('Email inválido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido.'),
});

export const resetPasswordSchema = z
  .object({
    code: z.string().min(1, 'El código es requerido.'),
    password: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirmation'],
  });

export const setSessionSchema = z.object({
  token: z.string().min(1, 'El token de acceso es requerido.'),
});

// --- JWT and Cookie Management ---

export async function createSessionCookie(strapiToken: string) {
  // We re-sign the Strapi token into our own JWT to control its lifecycle
  // and prevent the Strapi token from being exposed directly.
  const signedToken = await new SignJWT({token: strapiToken})
    .setProtectedHeader({alg: 'HS256'})
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_TTL_DAYS}d`)
    .sign(COOKIE_SECRET);

  return serialize(COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * COOKIE_TTL_DAYS,
  });
}

export function clearSessionCookie() {
  return serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getJwtFromCookie(
  request: NextRequest
): Promise<string | null> {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const {payload} = await jwtVerify(cookie, COOKIE_SECRET);
    // Ensure the payload contains the Strapi token
    if (typeof payload.token === 'string') {
      return payload.token;
    }
    return null;
  } catch (error) {
    // Catches expired or invalid signatures
    console.warn('[JWT_VERIFY_ERROR]', (error as Error).message);
    return null;
  }
}

// --- Standardized Error Responses ---

type ErrorCode =
  | 'validation_error'
  | 'invalid_credentials'
  | 'unauthorized'
  | 'email_in_use'
  | 'username_in_use'
  | 'rate_limited'
  | 'internal_server_error'
  | 'csrf_token_missing'
  | 'csrf_token_mismatch'
  | 'csrf_token_invalid'
  | 'cors_denied'
  | 'unknown_strapi_error';

const errorMap: Record<ErrorCode, {status: number; message: string}> = {
  validation_error: {status: 400, message: 'Datos de entrada inválidos.'},
  invalid_credentials: {status: 400, message: 'Email o contraseña inválidos.'},
  unauthorized: {status: 401, message: 'No autenticado o sesión expirada.'},
  email_in_use: {status: 409, message: 'El email ya está en uso.'},
  username_in_use: {status: 409, message: 'El nombre de usuario ya está en uso.'},
  rate_limited: {status: 429, message: 'Demasiados intentos. Intenta de nuevo más tarde.'},
  internal_server_error: {status: 500, message: 'Ocurrió un error en el servidor.'},
  csrf_token_missing: {status: 403, message: 'Token de seguridad faltante.'},
  csrf_token_mismatch: {status: 403, message: 'El token de seguridad no coincide.'},
  csrf_token_invalid: {status: 403, message: 'Token de seguridad inválido o expirado.'},
  cors_denied: {status: 403, message: 'Acceso denegado por política de CORS.'},
  unknown_strapi_error: {status: 500, message: 'Error inesperado de la API externa.'},
};

export function respondWithError(code: ErrorCode, extra: object = {}) {
  const {status, message} = errorMap[code];
  return NextResponse.json(
    {ok: false, code, message, ...extra},
    {status, headers: {'Content-Type': 'application/json'}}
  );
}

// --- Strapi Error Mapping ---
export function mapStrapiError(strapiError: any) {
  const message = strapiError?.error?.message || 'Unknown error';
  
  // Do not log the full error object in production if it contains sensitive data
  if (process.env.NODE_ENV !== 'production') {
    console.log('[STRAPI_ERROR_DETAIL]', JSON.stringify(strapiError, null, 2));
  }

  switch (message) {
    case 'Invalid identifier or password':
      return respondWithError('invalid_credentials');
    case 'Email is already taken.':
      return respondWithError('email_in_use');
    case 'Username already taken':
      return respondWithError('username_in_use');
    default:
      // Check for specific error names for password reset
      if (strapiError?.error?.name === 'ApplicationError' && message.includes('code invalid')) {
           return respondWithError('validation_error', {issues: {code: 'Código inválido o expirado.'}});
      }
      return respondWithError('unknown_strapi_error', {
        details: message,
      });
  }
}
