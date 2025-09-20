'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LineChart as ChartIcon, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';


interface TimeSeriesPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

interface TimeSeriesData {
    range: string;
    points: TimeSeriesPoint[];
}

async function fetchTimeSeries(range: '7' | '30'): Promise<TimeSeriesData> {
  const res = await fetch(`/api/ga/timeseries?range=${range}`, { next: { revalidate: 300 } });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'No se pudieron cargar los datos de la serie temporal.');
  }
  return res.json();
}

export const TrafficChart = () => {
  const [range, setRange] = React.useState<'7' | '30'>('7');
  const [data, setData] = React.useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTimeSeries(range);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [range]);
  
  const tickColor = resolvedTheme === 'dark' ? '#888' : '#666';

  const renderContent = () => {
    if (loading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-[350px]">
             <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al Cargar Gráfico</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      );
    }
    
    if (!data || data.points.length === 0) {
      return (
         <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">No hay datos de tráfico para mostrar.</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={data.points}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          aria-label={`Gráfico de tráfico de los últimos ${range} días.`}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="date"
            stroke={tickColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(str) => format(new Date(str), 'dd MMM', { locale: es })}
          />
          <YAxis
            stroke={tickColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toString()}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
            labelFormatter={(label) => format(new Date(label), "eeee, dd 'de' MMMM", { locale: es })}
          />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="visitors"
            name="Visitantes"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="pageViews"
            name="Páginas Vistas"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
             dot={{ r: 4, fill: "hsl(var(--chart-2))" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <ChartIcon />
                    Resumen de Tráfico
                </CardTitle>
                <CardDescription>Evolución de visitantes y páginas vistas.</CardDescription>
            </div>
            <Select value={range} onValueChange={(value: '7' | '30') => setRange(value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar rango" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};
