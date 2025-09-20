

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

export interface TopPageData {
  path: string;
  visitors: number;
}


interface GetAnalyticsOptions {
  timeseries?: '24h' | '7d' | '30d' | '90d';
}

/**
 * Obtiene métricas de Vercel Analytics.
 *
 * @returns {Promise<AnalyticsData[] | null>} Un array con los datos de análisis o null si hay un error.
 */
export async function getVercelAnalytics({ timeseries = '24h' }: GetAnalyticsOptions = {}): Promise<AnalyticsData[] | null> {
  // Verifica si las variables de entorno necesarias están configuradas
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('[VERCEL_ANALYTICS] VERCEL_API_TOKEN o VERCEL_PROJECT_ID no están configurados. Saltando la obtención de datos.');
    return null;
  }

  // Construye la URL de la API de Vercel
  const apiUrl = new URL('https://api.vercel.com/v1/analytics/data');
  apiUrl.searchParams.set('projectId', VERCEL_PROJECT_ID);
  apiUrl.searchParams.set('metrics', 'visitors,pageviews,bounceRate');
  apiUrl.searchParams.set('from', timeseries);

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
    if (data?.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => ({
        visitors: item.visitors ?? 0,
        pageviews: item.pageviews ?? 0,
        bounceRate: item.bounceRate ?? 0,
        date: item.date,
      }));
    }

    return null;
  } catch (error) {
    console.error('[VERCEL_ANALYTICS] Excepción al contactar la API de Vercel:', error);
    return null;
  }
}

export async function getVercelTopPages({ limit = 5 }: { limit?: number } = {}): Promise<TopPageData[] | null> {
    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      console.warn('[VERCEL_ANALYTICS] VERCEL_API_TOKEN o VERCEL_PROJECT_ID no están configurados. Saltando la obtención de datos.');
      return null;
    }
  
    const apiUrl = new URL('https://api.vercel.com/v1/analytics/data');
    apiUrl.searchParams.set('projectId', VERCEL_PROJECT_ID);
    apiUrl.searchParams.set('metrics', 'top-paths');
    apiUrl.searchParams.set('limit', String(limit));
  
    try {
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      });
  
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('[VERCEL_ANALYTICS] Error al obtener top pages:', {
          status: response.status,
          body: errorBody,
        });
        return null;
      }
  
      const data = await response.json();
  
      if (data?.data && Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          path: item.path ?? 'N/A',
          visitors: item.visitors ?? 0,
        }));
      }
  
      return null;
    } catch (error) {
      console.error('[VERCEL_ANALYTICS] Excepción al contactar la API de Vercel para top pages:', error);
      return null;
    }
  }

