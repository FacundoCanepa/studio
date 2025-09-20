// src/app/api/ga/timeseries/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getGaClient } from '@/lib/ga-client';
import { RunReportResponse } from '@google-analytics/data';

export const runtime = 'nodejs';

// Define el tipo de la respuesta esperada
interface TimeSeriesPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

interface TimeSeriesResponse {
  range: string;
  points: TimeSeriesPoint[];
}

export async function GET(request: NextRequest) {
  const { client, propertyId } = getGaClient();

  if (!client || !propertyId) {
    console.error('[GA4_TS] Google Analytics client is not initialized. Check environment variables.');
    return NextResponse.json(
      { error: 'Google Analytics client is not configured on the server.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range');
  const range = rangeParam === '30' ? '30' : '7';
  const startDate = `${range}daysAgo`;

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{
        dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' },
      }],
    });

    const data = processTimeSeriesResponse(response, range);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error('[GA4_TS] Error fetching Google Analytics time series data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time series data.' },
      { status: 500 }
    );
  }
}

/**
 * Procesa la respuesta de la API de GA4 para una serie temporal.
 * @param response La respuesta de la API de GA4.
 * @param range El rango de días solicitado.
 * @returns Un objeto con el rango y los puntos de datos procesados.
 */
function processTimeSeriesResponse(response: RunReportResponse, range: string): TimeSeriesResponse {
  const points: TimeSeriesPoint[] = [];

  if (response.rows) {
    response.rows.forEach(row => {
      if (row.dimensionValues && row.metricValues) {
        const rawDate = row.dimensionValues[0]?.value || '00000000';
        // Formatea la fecha de YYYYMMDD a YYYY-MM-DD
        const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
        
        const visitors = parseInt(row.metricValues[0]?.value || '0', 10);
        const pageViews = parseInt(row.metricValues[1]?.value || '0', 10);
        
        points.push({ date: formattedDate, visitors, pageViews });
      }
    });
  }

  return {
    range,
    points,
  };
}
