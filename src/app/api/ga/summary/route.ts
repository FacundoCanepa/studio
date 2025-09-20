
// src/app/api/ga/summary/route.ts
import { NextResponse } from 'next/server';
import { getGaClient } from '@/lib/ga-client';
import { RunReportResponse } from '@google-analytics/data';

export const runtime = 'nodejs';

// Define el tipo de la respuesta esperada para mayor claridad
interface AnalyticsSummary {
  visitors: number;
  pageViews: number;
  bounceRate: number;
  topPages: { path: string; count: number }[];
}

export async function GET() {
  const { client, propertyId } = getGaClient();

  if (!client || !propertyId) {
    console.error('[GA4_SUMMARY] Google Analytics client is not initialized. Check environment variables.');
    return NextResponse.json(
      { error: 'Google Analytics client is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
      ],
      dimensions: [{ name: 'pagePath' }],
      orderBys: [{
        metric: { metricName: 'screenPageViews' },
        desc: true,
      }],
      limit: 5, // Pedimos solo las 5 páginas principales
    });

    const summary = processAnalyticsResponse(response);

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error('[GA4_SUMMARY] Error fetching Google Analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data.' },
      { status: 500 }
    );
  }
}


/**
 * Procesa la respuesta de la API de Google Analytics para extraer las métricas clave.
 * @param response La respuesta de la API de GA4.
 * @returns Un objeto con los datos de analíticas procesados.
 */
function processAnalyticsResponse(response: RunReportResponse): AnalyticsSummary {
  let totalVisitors = 0;
  let totalPageViews = 0;
  let totalBounceRate = 0;
  const topPages: { path: string; count: number }[] = [];

  // Extraer los totales de las métricas. GA4 proporciona totales agregados.
  if (response.totals && response.totals.length > 0) {
    const totalsRow = response.totals[0];
    if (totalsRow.metricValues) {
      totalVisitors = parseInt(totalsRow.metricValues[0]?.value ?? '0', 10);
      totalPageViews = parseInt(totalsRow.metricValues[1]?.value ?? '0', 10);
      totalBounceRate = parseFloat(totalsRow.metricValues[2]?.value ?? '0');
    }
  }

  // Extraer las páginas principales. Ya vienen ordenadas por la API.
  if (response.rows) {
    response.rows.forEach(row => {
      if (row.dimensionValues && row.metricValues) {
        const path = row.dimensionValues[0]?.value || 'N/A';
        // El segundo métrico es screenPageViews
        const count = parseInt(row.metricValues[1]?.value || '0', 10);
        topPages.push({ path, count });
      }
    });
  }

  return {
    visitors: totalVisitors,
    pageViews: totalPageViews,
    bounceRate: totalBounceRate * 100, // Convertir a porcentaje
    topPages: topPages,
  };
}
