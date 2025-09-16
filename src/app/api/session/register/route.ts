
// src/app/api/session/register/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {z} from 'zod';
import { validateCsrf } from '@/lib/api/csrf';

// Esquema de validación con Zod
const registerSchema = z.object({
  username: z.string().min(3, {message: 'El nombre de usuario debe tener al menos 3 caracteres.'}),
  email: z.string().email({message: 'Por favor, introduce un email válido.'}),
  password: z.string().min(8, {message: 'La contraseña debe tener al menos 8 caracteres.'}),
});

const STRAPI_URL = process.env.STRAPI_URL;

export async function POST(request: NextRequest) {
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    // 1. Validar el cuerpo de la petición
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return NextResponse.json({
        ok: false,
        error: {
          code: 'validation_error',
          message: 'Por favor, corrige los errores en el formulario.',
          details: errors,
        },
      }, {status: 400});
    }

    // 2. Enviar la petición de registro a Strapi
    const strapiRes = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.data),
    });

    const strapiData = await strapiRes.json();

    // 3. Manejar la respuesta de Strapi
    if (!strapiRes.ok) {
      const strapiError = strapiData.error?.message || 'Error desconocido de Strapi.';
      let errorCode = 'strapi_error';
      let errorMessage = 'No se pudo completar el registro.';

      if (strapiError.includes('Email is already taken')) {
        errorCode = 'email_in_use';
        errorMessage = 'Este correo electrónico ya está en uso.';
      } else if (strapiError.includes('Username already taken')) {
        errorCode = 'username_in_use';
        errorMessage = 'Este nombre de usuario ya está en uso.';
      }
      
      return NextResponse.json({
        ok: false,
        error: {code: errorCode, message: errorMessage},
      }, {status: strapiRes.status});
    }

    // 4. Devolver respuesta de éxito
    return NextResponse.json({
      ok: true,
      data: {
        user: strapiData.user,
        message: '¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.',
      },
    });

  } catch (error) {
    console.error('[API_REGISTER_ERROR]', error);
    return NextResponse.json({
      ok: false,
      error: {code: 'internal_server_error', message: 'Ocurrió un error en el servidor.'},
    }, {status: 500});
  }
}
