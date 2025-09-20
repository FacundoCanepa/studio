
import * as React from 'react';
import { BarChart as ChartIcon, ExternalLink } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface AnalyticsData {
  topPages: { path: string; count: number }[];
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
      console.error('[TopPagesChart] Failed to fetch summary data:', {
        status: res.status,
        statusText: res.statusText,
      });
      return null;
    }

    const data = await res.json();
    return { topPages: data.topPages || [] };
  } catch (error) {
    console.error('[TopPagesChart] Error during fetch:', error);
    return null;
  }
}

export const TopPagesChart = async () => {
  const data = await getAnalyticsSummary();

  if (!data || !data.topPages || data.topPages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ChartIcon />Páginas Populares (7 días)</CardTitle>
          <CardDescription>Las 5 páginas más vistas de la última semana.</CardDescription>
        </CardHeader>
        <CardContent>
            <Alert>
                <AlertTitle>No hay datos disponibles</AlertTitle>
                <AlertDescription>
                Aún no hay suficientes datos de páginas vistas para mostrar en este gráfico.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.topPages.slice(0, 5).reverse(); // reverse for horizontal bar chart

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ChartIcon />Páginas Populares (7 días)</CardTitle>
        <CardDescription>Las 5 páginas más vistas de la última semana.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            aria-label="Gráfico de las 5 páginas más visitadas"
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis
              type="category"
              dataKey="path"
              width={100}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
            />
            <Tooltip
                contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                }}
                cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
            />
            <Bar dataKey="count" name="Vistas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Detalles</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ruta</TableHead>
                        <TableHead className="text-right">Vistas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.topPages.map((page) => (
                        <TableRow key={page.path}>
                            <TableCell className="font-medium truncate max-w-xs">
                                <Link href={page.path} target="_blank" className="flex items-center gap-2 hover:underline">
                                    {page.path} <ExternalLink className="h-3 w-3" />
                                </Link>
                            </TableCell>
                            <TableCell className="text-right font-mono">{page.count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
};
