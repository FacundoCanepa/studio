// src/lib/validation/author-schema.ts
import { z } from 'zod';

/**
 * Convierte una cadena a kebab-case.
 * Ej: "Hola Mundo" -> "hola-mundo"
 */
export function toKebabCase(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD') // Separa acentos de las letras
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres no alfanuméricos (excepto espacios y guiones)
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-') // Colapsa múltiples guiones
    .replace(/^-+|-+$/g, ''); // Elimina guiones al inicio y al final
}

export const authorSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  bio: z.string().optional(),
  pendingCoverId: z.string().optional(),
});

export type AuthorFormData = z.infer<typeof authorSchema>;

/**
 * Normaliza los datos del formulario del autor antes de la validación.
 * @param values - Un objeto con los valores del formulario.
 * @returns Un objeto con los valores normalizados.
 */
export function normalizeAuthorForm(values: Record<string, any>): Partial<AuthorFormData> {
    const normalized: Partial<AuthorFormData> = {};
    
    if (typeof values.name === 'string') normalized.name = values.name.trim();
    if (typeof values.bio === 'string') normalized.bio = values.bio.trim();
    if (values.pendingCoverId !== undefined) normalized.pendingCoverId = values.pendingCoverId;

    return normalized;
}