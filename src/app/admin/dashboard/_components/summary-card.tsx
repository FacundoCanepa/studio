import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  href?: string;
}

export const SummaryCard = ({ title, value, icon: Icon, description, href }: SummaryCardProps) => {
  const CardContentWrapper = href ? Link : 'div';
  const WrapperProps = href ? { href } : {};

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContentWrapper {...WrapperProps} className="block h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
      </CardContentWrapper>
    </Card>
  );
};
