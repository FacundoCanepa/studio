
'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GanttChartSquare, Tag } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ChartData {
  name: string;
  value: number;
}

interface DistributionChartsProps {
  byCategory: ChartData[];
  byTag: ChartData[];
}

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export const DistributionCharts = ({ byCategory, byTag }: DistributionChartsProps) => {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const tickColor = isDark ? '#888' : '#666';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GanttChartSquare />Artículos por Categoría</CardTitle>
                <CardDescription>Distribución de todos los artículos publicados en cada categoría.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={byCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={110}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {byCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                background: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))', 
                                borderRadius: 'var(--radius)' 
                            }}
                        />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><Tag />Artículos por Etiqueta (Top 10)</CardTitle>
                <CardDescription>Distribución de los artículos según las 10 etiquetas más utilizadas.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byTag.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis type="number" stroke={tickColor} />
                        <YAxis type="category" dataKey="name" width={80} stroke={tickColor} style={{ fontSize: '12px' }} />
                        <Tooltip 
                             contentStyle={{ 
                                background: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))', 
                                borderRadius: 'var(--radius)' 
                            }}
                            cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
                        />
                        <Bar dataKey="value" name="Artículos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
};
