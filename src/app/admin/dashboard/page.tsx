
import { Metadata } from 'next';
import { getArticles, getAuthors, getCategories, getTags, getGalleryItems } from '@/lib/strapi-client';
import { performStrapiRequest } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Newspaper, Users, GanttChartSquare, Tag, Image as ImageIcon, UserCircle, Mail } from 'lucide-react';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard - Admin Panel',
};

// Force dynamic rendering to ensure fresh data on each page load
export const revalidate = 0;

// --- Data Fetching Helpers ---

async function fetchTotalCount(endpoint: string): Promise<number> {
  try {
    const query = qs({ pagination: { pageSize: 1 } });
    const response = await performStrapiRequest(`${endpoint}${query}`, { method: 'GET', cache: 'no-store' });
    return response.meta?.pagination?.total ?? 0;
  } catch (error) {
    console.error(`[DASHBOARD] Error fetching total count for ${endpoint}:`, error);
    return 0;
  }
}

async function fetchRecent(endpoint: string, fields: string[]): Promise<any[]> {
  try {
    const query = qs({
      sort: 'createdAt:desc',
      pagination: { limit: 5 },
      fields: fields,
    });
    const response = await performStrapiRequest(`${endpoint}${query}`, { method: 'GET', cache: 'no-store' });
    return response.data ?? [];
  } catch (error) {
    console.error(`[DASHBOARD] Error fetching recent items from ${endpoint}:`, error);
    return [];
  }
}

// --- UI Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const StatCard = ({ title, value, icon: Icon, description }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

interface RecentActivityTableProps<T> {
    title: string;
    items: T[];
    icon: React.ComponentType<{ className?: string }>;
    renderRow: (item: T) => ReactNode;
    headers: string[];
}

const RecentActivityTable = <T,>({ title, items, icon: Icon, renderRow, headers }: RecentActivityTableProps<T>) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length > 0 ? (
                        items.map(renderRow)
                    ) : (
                        <TableRow>
                            <TableCell colSpan={headers.length} className="text-center">No hay registros recientes.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);


export default async function AdminDashboardPage() {
  const [
    articles,
    authors,
    categories,
    tags,
    galleryItems,
    totalUsers,
    recentUsers,
    totalSubscribers,
    recentSubscribers
  ] = await Promise.all([
    getArticles({ limit: -1 }),
    getAuthors({ cache: 'no-store' }),
    getCategories({ cache: 'no-store' }),
    getTags(),
    getGalleryItems(),
    fetchTotalCount('/api/users'),
    fetchRecent('/api/users', ['username', 'email', 'createdAt', 'confirmed']),
    fetchTotalCount('/api/subscribers'),
    fetchRecent('/api/subscribers', ['email', 'createdAt', 'source']),
  ]);

  const stats = [
    { title: 'Total de Artículos', value: articles.length, icon: Newspaper },
    { title: 'Total de Autores', value: authors.length, icon: Users },
    { title: 'Total de Categorías', value: categories.length, icon: GanttChartSquare },
    { title: 'Total de Etiquetas', value: tags.length, icon: Tag },
    { title: 'Items en Galería', value: galleryItems.length, icon: ImageIcon },
    { title: 'Usuarios Registrados', value: totalUsers, icon: UserCircle },
    { title: 'Suscriptores', value: totalSubscribers, icon: Mail },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <RecentActivityTable
            title="Últimos Usuarios Registrados"
            icon={UserCircle}
            items={recentUsers}
            headers={['Usuario', 'Email', 'Estado', 'Fecha']}
            renderRow={(user) => (
                <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.confirmed ? 'default' : 'secondary'}>
                            {user.confirmed ? 'Confirmado' : 'Pendiente'}
                        </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es })}</TableCell>
                </TableRow>
            )}
        />
        <RecentActivityTable
            title="Últimos Suscriptores"
            icon={Mail}
            items={recentSubscribers}
            headers={['Email', 'Fuente', 'Fecha']}
            renderRow={(subscriber) => (
                <TableRow key={subscriber.id}>
                    <TableCell>{subscriber.email}</TableCell>
                     <TableCell>
                        <Badge variant="outline">{subscriber.source}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(subscriber.createdAt), 'dd MMM yyyy', { locale: es })}</TableCell>
                </TableRow>
            )}
        />
      </section>
    </div>
  );
}

    