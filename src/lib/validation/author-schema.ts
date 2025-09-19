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

/**
 * Normaliza y sanitiza una URL de red social.
 * @param url La URL a normalizar.
 * @param platformName El nombre de la plataforma (ej: "instagram").
 * @returns La URL normalizada o una cadena vacía si es inválida.
 */
function normalizeSocialUrl(url: string | undefined, platformName: string): string {
    if (!url) return '';
    let trimmedUrl = url.trim();
    if (!trimmedUrl) return '';

    if (!trimmedUrl.startsWith('http')) {
        trimmedUrl = `https://${trimmedUrl}`;
    }

    try {
        const urlObject = new URL(trimmedUrl);
        if (urlObject.hostname.includes(platformName)) {
            return urlObject.toString();
        }
        return ''; // No es una URL de la plataforma esperada
    } catch {
        return ''; // URL inválida
    }
}

export const authorSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres.')
    .transform(value => toKebabCase(value)),
  bio: z.string().optional(),
  role: z.string().optional(),
  avatarUrl: z.string().url('La URL del avatar debe ser válida.').optional().or(z.literal('')),
  instagram: z.string().optional().transform(url => normalizeSocialUrl(url, 'instagram')),
  tiktok: z.string().optional().transform(url => normalizeSocialUrl(url, 'tiktok')),
  youtube: z.string().optional().transform(url => normalizeSocialUrl(url, 'youtube')),
  website: z.string().url('La URL del sitio web debe ser válida.').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export type AuthorFormData = z.infer<typeof authorSchema>;

/**
 * Normaliza los datos del formulario del autor antes de la validación.
 * Esta función no es estrictamente necesaria si se usa .transform() en Zod,
 * pero puede ser útil para pre-procesar FormData.
 * @param values - Un objeto con los valores del formulario.
 * @returns Un objeto con los valores normalizados.
 */
export function normalizeAuthorForm(values: Record<string, any>): Partial<AuthorFormData> {
    const normalized: Partial<AuthorFormData> = {};
    
    if (typeof values.name === 'string') normalized.name = values.name.trim();
    if (typeof values.slug === 'string') normalized.slug = toKebabCase(values.slug);
    if (typeof values.bio === 'string') normalized.bio = values.bio.trim();
    if (typeof values.role === 'string') normalized.role = values.role.trim();
    if (typeof values.avatarUrl === 'string') normalized.avatarUrl = values.avatarUrl.trim();
    if (typeof values.instagram === 'string') normalized.instagram = values.instagram.trim();
    if (typeof values.tiktok === 'string') normalized.tiktok = values.tiktok.trim();
    if (typeof values.youtube === 'string') normalized.youtube = values.youtube.trim();
    if (typeof values.website === 'string') normalized.website = values.website.trim();

    normalized.isActive = values.isActive === 'on' || values.isActive === true;
    normalized.featured = values.featured === 'on' || values.featured === true;

    return normalized;
}
