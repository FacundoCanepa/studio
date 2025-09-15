import {z} from 'zod';
import {serialize} from 'cookie';
import {type NextRequest} from 'next/server';

export const API_BASE = `${process.env.STRAPI_URL}/api`;

// --- Zod Schemas for Validation ---
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

export const resetPasswordSchema = z.object({
  code: z.string().min(1, 'El código es requerido.'),
  password: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirmation"],
});

export const setSessionSchema = z.object({
  token: z.string().min(1, 'El token de acceso es requerido.'),
});

// --- Cookie Management ---
const COOKIE_NAME = process.env.COOKIE_NAME!;
const COOKIE_TTL_DAYS = Number(process.env.COOKIE_TTL_DAYS!);

export function createSessionCookie(token: string) {
  return serialize(COOKIE_NAME, token, {
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

// --- Error Handling ---
export function mapStrapiError(strapiError: any) {
  const message = strapiError?.error?.message || 'Error desconocido.';
  const status = strapiError?.error?.status || 500;

  switch (message) {
    case 'Invalid identifier or password':
      return {status: 400, message: 'Email o contraseña inválidos.'};
    case 'Email is already taken.':
      return {status: 409, message: 'El email ya está en uso.'};
    case 'Username already taken':
      return {status: 409, message: 'El nombre de usuario ya está en uso.'};
    // Add more specific mappings as needed
    default:
      return {status, message};
  }
}
