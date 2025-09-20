
'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import type { TopPageData } from '@/lib/vercel-analytics';
import { TrendingUp } from 'lucide-react';

interface TopPagesChartProps {
  data: TopPageData[];
}

export const TopPagesChart = ({ data }: TopPagesChartProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tickColor = isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))';
  const gridColor = isDark ? 'hsl(var(--border) / 0.5)' : 'hsl(var(--border))';

  const chartData = data.sort((a, b) => a.visitors - b.visitors);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp />Top 5 Páginas Más Visitadas</CardTitle>
        <CardDescription>Basado en visitantes únicos de los últimos 7 días.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis type="number" stroke={tickColor} fontSize={12} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="path"
              stroke={tickColor}
              fontSize={12}
              width={100}
              tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
            />
            <Bar dataKey="visitors" name="Visitantes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
