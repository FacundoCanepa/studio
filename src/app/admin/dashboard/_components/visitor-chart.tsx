
'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalyticsData } from '@/lib/vercel-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface VisitorChartProps {
  data: AnalyticsData[];
}

export const VisitorChart = ({ data }: VisitorChartProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tickColor = isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))';
  const gridColor = isDark ? 'hsl(var(--border) / 0.5)' : 'hsl(var(--border))';

  const chartData = data.map(item => ({
    date: item.date,
    formattedDate: format(parseISO(item.date), "dd MMM", { locale: es }),
    visitors: item.visitors,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 />Visitantes (Últimos 7 días)</CardTitle>
        <CardDescription>Evolución diaria del número de visitantes únicos.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="formattedDate"
              stroke={tickColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={tickColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              name="Visitantes"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorVisitors)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
