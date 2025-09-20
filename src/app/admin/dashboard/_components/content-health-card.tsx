import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ImageOff, Link2, Users, GanttChartSquare } from 'lucide-react';
import type { AuthorDoc, CategoryDoc } from '@/lib/firestore-types';

interface HealthMetrics {
  noCover: number;
  noSeo: number;
  authorsWithoutBio: number;
  categoriesWithoutDescription: number;
}

interface ContentHealthCardProps {
  metrics: HealthMetrics;
}

const HealthAlert = ({ count, children, isCritical }: { count: number; children: React.ReactNode; isCritical: boolean }) => (
  <Alert variant={isCritical ? 'destructive' : 'default'}>
    {children}
    <AlertTitle>{count} {count === 1 ? 'ítem' : 'ítems'}</AlertTitle>
  </Alert>
);

export const ContentHealthCard = ({ metrics }: ContentHealthCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle />Cobertura de Contenido</CardTitle>
        <CardDescription>Alertas sobre contenido que podría estar incompleto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <HealthAlert count={metrics.noCover} isCritical={metrics.noCover > 0}>
          <ImageOff className="h-4 w-4" />
          <span className="sr-only">Artículos sin portada</span>
        </HealthAlert>
        <HealthAlert count={metrics.noSeo} isCritical={metrics.noSeo > 0}>
          <Link2 className="h-4 w-4" />
          <span className="sr-only">Artículos sin SEO básico</span>
        </HealthAlert>
        <HealthAlert count={metrics.authorsWithoutBio} isCritical={metrics.authorsWithoutBio > 0}>
          <Users className="h-4 w-4" />
          <span className="sr-only">Autores sin biografía</span>
        </HealthAlert>
        <HealthAlert count={metrics.categoriesWithoutDescription} isCritical={metrics.categoriesWithoutDescription > 0}>
          <GanttChartSquare className="h-4 w-4" />
          <span className="sr-only">Categorías sin descripción</span>
        </HealthAlert>
      </CardContent>
    </Card>
  );
};
