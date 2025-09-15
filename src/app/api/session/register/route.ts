// src/app/api/session/register/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  registerSchema,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';

/**
 * Handles user registration by proxying data to Strapi.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    // 2. Proxy register request to Strapi
    const strapiRes = await fetch(`${API_BASE}/auth/local/register`, {
      method: 'POST