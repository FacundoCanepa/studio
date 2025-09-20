

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
type RawMetricValue = number | { value?: number; total?: number; count?: number } | null | undefined;

const normalizeMetricValue = (metric: RawMetricValue): number => {
  if (typeof metric === 'number') {
    return Number.isFinite(metric) ? metric : 0;
  }

  if (metric && typeof metric === 'object') {
    if (typeof metric.value === 'number') {
      return metric.value;
    }
    if (typeof metric.total === 'number') {
      return metric.total;
    }
    if (typeof metric.count === 'number') {
      return metric.count;
    }
  }

  return 0;
};

const normalizeBounceRate = (metric: RawMetricValue): number => {
  const value = normalizeMetricValue(metric);

  if (value > 1) {
    return value / 100;
  }

  return value;
};

const normalizeDate = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
};

const extractTimeseries = (payload: any): AnalyticsData[] => {
  const series: unknown =
    payload?.timeseries ??
    payload?.series ??
    payload?.data ??
    payload?.analytics?.timeseries ??
    payload?.analytics?.overview?.timeseries;

  if (!Array.isArray(series)) {
    return [];
  }

  return series
    .map((entry: any) => {
      const value = entry?.value ?? entry?.metrics ?? entry;
      const date =
        normalizeDate(entry?.timestamp) ??
        normalizeDate(entry?.date) ??
        normalizeDate(entry?.start) ??
        normalizeDate(entry?.time) ??
        normalizeDate(entry?.from);

      if (!date) {
        return null;
      }

      return {
        date,
        visitors: normalizeMetricValue(
          value?.visitors ?? value?.visits ?? value?.users ?? value?.uniqueVisitors
        ),
        pageviews: normalizeMetricValue(
          value?.pageviews ?? value?.pageViews ?? value?.views ?? value?.sessions
        ),
        bounceRate: normalizeBounceRate(value?.bounceRate ?? value?.bounce_rate ?? value?.bounce_rate_percentage),
      } satisfies AnalyticsData;
    })
    .filter((entry: AnalyticsData | null): entry is AnalyticsData => Boolean(entry))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const extractOverviewMetrics = (payload: any): AnalyticsData | null => {
  const metrics =
    payload?.metrics ??
    payload?.overview?.metrics ??
    payload?.analytics?.metrics ??
    payload?.analytics?.overview?.metrics ??
    payload?.totals ??
    payload?.summary;

  if (!metrics || typeof metrics !== 'object') {
    return null;
  }

  return {
    date: new Date().toISOString(),
    visitors: normalizeMetricValue(metrics?.visitors ?? metrics?.visits ?? metrics?.users ?? metrics?.uniqueVisitors),
    pageviews: normalizeMetricValue(metrics?.pageviews ?? metrics?.pageViews ?? metrics?.views ?? metrics?.sessions),
    bounceRate: normalizeBounceRate(metrics?.bounceRate ?? metrics?.bounce_rate ?? metrics?.bounce_rate_percentage),
  };
};

export async function getVercelAnalytics({ timeseries = '24h' }: GetAnalyticsOptions = {}): Promise<AnalyticsData[] | null> {
  // Verifica si las variables de entorno necesarias están configuradas
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('[VERCEL_ANALYTICS] VERCEL_API_TOKEN o VERCEL_PROJECT_ID no están configurados. Saltando la obtención de datos.');
    return null;
  }

  // Construye la URL de la API de Vercel
  const apiUrl = new URL('https://api.vercel.com/v1/analytics/overview');
  apiUrl.searchParams.set('projectId', VERCEL_PROJECT_ID);
  apiUrl.searchParams.set('period', timeseries);

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
        statusText: response.statusText,
        body: errorBody,
      });
      // Devuelve null en caso de error para no romper el dashboard
      return null;
    }

    const data = await response.json();

    const timeseriesData = extractTimeseries(data);

    if (timeseriesData.length > 0) {
      return timeseriesData;
    }

    const overviewMetrics = extractOverviewMetrics(data);

    if (overviewMetrics) {
      return [overviewMetrics];
    }

    console.warn('[VERCEL_ANALYTICS] La respuesta de la API no contiene datos reconocibles de analíticas.');
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

    const apiUrl = new URL('https://api.vercel.com/v1/analytics/top-pages');
    apiUrl.searchParams.set('projectId', VERCEL_PROJECT_ID);
    apiUrl.searchParams.set('period', '7d');
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
          statusText: response.statusText,
          body: errorBody,
        });
        return null;
      }

      const data = await response.json();

      const pages: unknown = data?.pages ?? data?.topPages ?? data?.data;

      if (Array.isArray(pages)) {
        const normalized = pages.map((item: any) => ({
          path: item?.path ?? item?.pathname ?? item?.url ?? 'N/A',
          visitors: normalizeMetricValue(item?.visitors ?? item?.visits ?? item?.users ?? item?.uniqueVisitors),
        }));

        return normalized;
      }

      console.warn('[VERCEL_ANALYTICS] La respuesta de top pages no contiene datos reconocibles.');
      return null;
    } catch (error) {
      console.error('[VERCEL_ANALYTICS] Excepción al contactar la API de Vercel para top pages:', error);
      return null;
    }
  }
