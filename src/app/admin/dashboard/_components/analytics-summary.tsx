import * as React from 'react';
import { SummaryCard } from './summary-card';
import { Users, Eye, TrendingDown, ServerCrash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AnalyticsData {
  visitors: number;
  pageViews: number;
  bounceRate: number;
}

function resolveBaseUrl(): string {
  const envUrl =
    process.env.FRONT_ORIGIN_PROD ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL;

  if (envUrl) {
    if (envUrl.startsWith('http')) {
      return envUrl;
    }
    return `https://${envUrl}`;
  }

  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}


async function getAnalyticsSummary(): Promise<AnalyticsData | null> {
  try {
    const baseUrl = resolveBaseUrl();
    const res = await fetch(`${baseUrl}/api/ga/summary`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('[AnalyticsSummary] Failed to fetch summary data:', {
        status: res.status,
        statusText: res.statusText,
      });
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('[AnalyticsSummary] Error during fetch:', error);
    return null;
  }
}

export const AnalyticsSummary = async () => {
  const data = await getAnalyticsSummary();

  if (!data) {
    return (
      <Alert variant="destructive" className="md:col-span-3">
        <ServerCrash className="h-4 w-4" />
        <AlertTitle>Error al Cargar Analíticas</AlertTitle>
        <AlertDescription>
          No se pudieron obtener los datos de Google Analytics. Verifica la configuración de las variables de entorno (`GA4_PROPERTY_ID`, etc.).
        </AlertDescription>
      </Alert>
    );
  }
  
  const bounceRate = data.bounceRate ? `${data.bounceRate.toFixed(2)}%` : '—';

  return (
    <>
      <SummaryCard title="Visitantes (7d)" value={data.visitors ?? '—'} icon={Users} description="Usuarios únicos" />
      <SummaryCard title="Páginas Vistas (7d)" value={data.pageViews ?? '—'} icon={Eye} description="Total de vistas" />
      <SummaryCard title="Tasa de Rebote (7d)" value={bounceRate} icon={TrendingDown} description="Sesiones de una sola página" />
    </>
  );
};
