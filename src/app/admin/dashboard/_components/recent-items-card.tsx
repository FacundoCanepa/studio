import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RecentItemsCardProps<T> {
  title: string;
  items: T[];
  columns: { header: string; accessor: (item: T) => React.ReactNode }[];
  icon: React.ComponentType<{ className?: string }>;
}

export function RecentItemsCard<T extends { id?: number | string; documentId?: string }>({ title, items, columns, icon: Icon }: RecentItemsCardProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => <TableHead key={col.header}>{col.header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => (
                <TableRow key={item.id ?? item.documentId}>
                  {columns.map(col => <TableCell key={col.header}>{col.accessor(item)}</TableCell>)}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24 text-muted-foreground">
                  No hay datos recientes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
