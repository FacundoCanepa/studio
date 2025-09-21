'use client';

import * as React from 'react';
import { BarChart as ChartIcon, ExternalLink, AlertCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  topPages: { path: string; count: number }[];
}

async function fetchTopPages(): Promise<AnalyticsData> {
  const res = await fetch('/api/ga/summary', { cache: 'no-store' });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error ?? 'No se pudieron cargar los datos de páginas populares.');
  }

  const data = await res.json();
  return { topPages: data.topPages ?? [] };
}

export const TopPagesChart = () => {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchTopPages();
        if (!active) {
          return;
        }
        setData(result);
      } catch (err) {
        if (!active) {
          return;
        }
        setData(null);
        setError(err instanceof Error ? err.message : 'Error desconocido.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const chartData = data?.topPages?.slice(0, 5).reverse() ?? [];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-[250px] w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar las páginas populares</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!data || chartData.length === 0) {
      return (
        <Alert>
          <AlertTitle>No hay datos disponibles</AlertTitle>
          <AlertDescription>
            Aún no hay suficientes datos de páginas vistas para mostrar en este gráfico.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
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
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ChartIcon />Páginas Populares (7 días)</CardTitle>
        <CardDescription>Las 5 páginas más vistas de la última semana.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">{renderContent()}</CardContent>
    </Card>
  );
};