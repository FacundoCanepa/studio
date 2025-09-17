

// src/lib/api-utils.ts
import {z} from 'zod';
import {serialize} from 'cookie';
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

export const API_BASE = `${requiredEnv('NEXT_PUBLIC_STRAPI_URL')}/api`;
export const COOKIE_NAME = requiredEnv('COOKIE_NAME');
export const COOKIE_SECRET = new TextEncoder().encode(
  requiredEnv('COOKIE_SECRET')
);
export const COOKIE_TTL_DAYS = parseInt(process.env.COOKIE_TTL_DAYS || '7', 10);

// --- Zod Schemas for Input Validation ---
export const loginSchema = z.object({
  identifier: z.string().email('Email inválido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres.'),
  email: z.string().email('Email inválido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({message: 'Por favor, introduce un email válido.'}),
});

export const resetPasswordSchema = z
  .object({
    code: z.string().min(1, {message: 'El código es requerido.'}),
    password: z
      .string()
      .min(8, {message: 'La contraseña debe tener al menos 8 caracteres.'}),
    passwordConfirmation: z.string(),
  })
  .refine(data => data.password === data.passwordConfirmation, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirmation'],
  });

// --- JWT and Cookie Management ---
export async function createSessionCookie(strapiToken: string) {
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
    if (typeof payload.token === 'string') {
      return payload.token;
    }
    return null;
  } catch (error) {
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
  | 'internal_server_error'
  | 'unknown_strapi_error'
  | 'rate_limit_exceeded';

const errorMap: Record<ErrorCode, {status: number; message: string}> = {
  validation_error: {status: 400, message: 'Datos de entrada inválidos.'},
  invalid_credentials: {status: 400, message: 'Email o contraseña inválidos.'},
  unauthorized: {status: 401, message: 'No autenticado o sesión expirada.'},
  email_in_use: {status: 409, message: 'El email ya está en uso.'},
  username_in_use: {status: 409, message: 'El nombre de usuario ya está en uso.'},
  internal_server_error: {status: 500, message: 'Ocurrió un error en el servidor.'},
  unknown_strapi_error: {status: 500, message: 'Error inesperado de la API externa.'},
  rate_limit_exceeded: {status: 429, message: 'Demasiados intentos.'},
};

export function respondWithError(code: ErrorCode, extra: object = {}) {
  const {status, message} = errorMap[code];
  return NextResponse.json(
    {ok: false, error: {code, message, ...extra}},
    {status, headers: {'Content-Type': 'application/json'}}
  );
}

// --- Strapi Error Mapping ---
export function mapStrapiError(strapiData: any) {
  const message = strapiData?.error?.message || 'Unknown error';
  const status = strapiData?.error?.status;

  if (process.env.NODE_ENV !== 'production') {
    console.log('[STRAPI_ERROR_DETAIL]', JSON.stringify(strapiData, null, 2));
  }

  let code: ErrorCode;
  switch (message) {
    case 'Invalid identifier or password':
      code = 'invalid_credentials';
      break;
    case 'Email is already taken.':
      code = 'email_in_use';
      break;
    case 'Username already taken':
      code = 'username_in_use';
      break;
    default:
      code = 'unknown_strapi_error';
  }
  
  const responseBody = {ok: false, error: {code: code, message: errorMap[code].message, details: message}};
  return NextResponse.json(responseBody, {status: status || errorMap[code].status});
}
