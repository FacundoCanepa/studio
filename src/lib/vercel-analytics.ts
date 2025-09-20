'use server';

import 'server-only';

// Lee las variables de entorno de forma segura en el servidor
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

export interface AnalyticsData {
  visitors: number;
  pageviews: number;
  bounceRate: number;
  date: string;
}

/**
 * Obtiene métricas de Vercel Analytics para las últimas 24 horas.
 *
 * @returns {Promise<AnalyticsData | null>} Un objeto con los datos de análisis o null si hay un error.
 */
export async function getVercelAnalytics(): Promise<AnalyticsData | null> {
  // Verifica si las variables de entorno necesarias están configuradas
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('[VERCEL_ANALYTICS] VERCEL_API_TOKEN o VERCEL_PROJECT_ID no están configurados. Saltando la obtención de datos.');
    return null;
  }

  // Construye la URL de la API de Vercel
  const apiUrl = new URL('https://api.vercel.com/v1/analytics/data');
  apiUrl.searchParams.set('projectId', VERCEL_PROJECT_ID);
  apiUrl.searchParams.set('metrics', 'visitors,pageviews,bounceRate');
  apiUrl.searchParams.set('from', '24h');

  try {
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Cache para evitar peticiones excesivas, revalida cada hora
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[VERCEL_ANALYTICS] Error al obtener datos de Vercel:', {
        status: response.status,
        body: errorBody,
      });
      // Devuelve null en caso de error para no romper el dashboard
      return null;
    }

    const data = await response.json();
    
    // Procesa y devuelve los datos en el formato requerido
    const latestData = data?.data?.[0];
    if (latestData) {
      return {
        visitors: latestData.visitors ?? 0,
        pageviews: latestData.pageviews ?? 0,
        bounceRate: latestData.bounceRate ?? 0,
        date: latestData.date,
      };
    }

    return null;
  } catch (error) {
    console.error('[VERCEL_ANALYTICS] Excepción al contactar la API de Vercel:', error);
    return null;
  }
}
