
import { Metadata } from 'next';
import { getArticles, getAuthors, getCategories, getTags, getGalleryItems } from '@/lib/strapi-client';
import { performStrapiRequest } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Newspaper, Users, GanttChartSquare, Tag, Image as ImageIcon, UserCircle, Mail,
  CheckCircle, XCircle, Star, Home, Sparkles, TrendingUp, AlertTriangle, BookOpen, Link as LinkIcon, Youtube,
  FileText, ImageOff
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ArticleDoc, AuthorDoc, CategoryDoc, TagDoc } from '@/lib/firestore-types';
import Link from 'next/link';

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
  href?: string;
}

const StatCard = ({ title, value, icon: Icon, description, href }: StatCardProps) => {
  const CardContentWrapper = href ? Link : 'div';
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContentWrapper href={href!} className="block h-full">
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
  )
};

interface MetricCardProps {
  title: string;
  metrics: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; }[];
  icon: React.ComponentType<{ className?: string }>;
}

const MetricCard = ({ title, metrics, icon: Icon }: MetricCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {metrics.map(({ label, value, icon: MetricIcon }) => (
        <div key={label} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MetricIcon className="h-4 w-4" />
            <span>{label}</span>
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

interface TopListCardProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

const TopListCard = <T,>({ title, items, renderItem, icon: Icon }: TopListCardProps<T>) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map(renderItem)}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No hay datos suficientes.</p>
      )}
    </CardContent>
  </Card>
)


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

  // --- Metrics Calculation ---
  const articleMetrics = {
    published: articles.filter(a => a.publishedAt).length,
    drafts: articles.filter(a => !a.publishedAt).length,
    featured: articles.filter(a => a.featured).length,
    home: articles.filter(a => a.home).length,
    isNew: articles.filter(a => a.isNew).length,
    tendencias: articles.filter(a => a.tendencias).length,
  };

  const incompleteArticles = {
    noCover: articles.filter(a => !a.coverUrl).length,
    noCategory: articles.filter(a => !a.category).length,
    noAuthor: articles.filter(a => !a.author).length,
    noTags: articles.filter(a => !a.tags || a.tags.length === 0).length,
    noContentMore: articles.filter(a => !a.contentMore).length,
    noInformacion: articles.filter(a => !a.informacion).length,
    noYoutube: articles.filter(a => !a.urlYoutube).length,
    noSeo: articles.filter(a => !a.seo?.metaTitle || !a.seo?.metaDescription).length,
  };

  const calculateTopItems = <T extends { documentId: string, name: string }>(
    items: T[],
    articles: ArticleDoc[],
    key: 'category' | 'author' | 'tags'
  ) => {
    const counts = new Map<string, { item: T, count: number }>();
    articles.forEach(article => {
      const relatedItems = Array.isArray(article[key]) ? article[key] : [article[key]];
      relatedItems.forEach(item => {
        if (item) {
          const existing = counts.get(item.documentId) || { item: items.find(i => i.documentId === item.documentId)!, count: 0 };
          if(existing.item) {
            existing.count++;
            counts.set(item.documentId, existing);
          }
        }
      });
    });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  const topCategories = calculateTopItems<CategoryDoc>(categories, articles, 'category');
  const topAuthors = calculateTopItems<AuthorDoc>(authors, articles, 'author');
  const topTags = calculateTopItems<TagDoc>(tags, articles, 'tags');

  const stats = [
    { title: 'Total de Artículos', value: articles.length, icon: Newspaper, href: '/admin/articles' },
    { title: 'Total de Autores', value: authors.length, icon: Users, href: '/admin/authors' },
    { title: 'Total de Categorías', value: categories.length, icon: GanttChartSquare, href: '/admin/categories' },
    { title: 'Items en Galería', value: galleryItems.length, icon: ImageIcon, href: '/admin/galeria' },
    { title: 'Total de Etiquetas', value: tags.length, icon: Tag, href: '/admin/tags' },
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MetricCard 
          title="Estado de Artículos"
          icon={Newspaper}
          metrics={[
            { label: 'Publicados', value: articleMetrics.published, icon: CheckCircle },
            { label: 'Borradores', value: articleMetrics.drafts, icon: XCircle },
            { label: 'Destacados', value: articleMetrics.featured, icon: Star },
            { label: 'En Portada', value: articleMetrics.home, icon: Home },
            { label: 'Nuevos', value: articleMetrics.isNew, icon: Sparkles },
            { label: 'Tendencias', value: articleMetrics.tendencias, icon: TrendingUp },
          ]}
        />
         <MetricCard 
          title="Artículos Incompletos"
          icon={AlertTriangle}
          metrics={[
            { label: 'Sin Portada', value: incompleteArticles.noCover, icon: ImageOff },
            { label: 'Sin Categoría', value: incompleteArticles.noCategory, icon: GanttChartSquare },
            { label: 'Sin Autor', value: incompleteArticles.noAuthor, icon: Users },
            { label: 'Sin Etiquetas', value: incompleteArticles.noTags, icon: Tag },
            { label: 'Sin Contenido Extra', value: incompleteArticles.noContentMore, icon: BookOpen },
            { label: 'Sin Información', value: incompleteArticles.noInformacion, icon: FileText },
            { label: 'Sin Video', value: incompleteArticles.noYoutube, icon: Youtube },
            { label: 'Sin SEO Básico', value: incompleteArticles.noSeo, icon: LinkIcon },
          ]}
        />
        <div className="space-y-8">
            <TopListCard 
              title="Top 5 Categorías"
              items={topCategories}
              icon={GanttChartSquare}
              renderItem={({ item, count }) => (
                 <li key={item.documentId} className="flex justify-between items-center text-sm">
                    <span>{item.name}</span>
                    <Badge variant="secondary">{count} art.</Badge>
                </li>
              )}
            />
             <TopListCard 
              title="Top 5 Autores"
              items={topAuthors}
              icon={Users}
              renderItem={({ item, count }) => (
                 <li key={item.documentId} className="flex justify-between items-center text-sm">
                    <span>{item.name}</span>
                    <Badge variant="secondary">{count} art.</Badge>
                </li>
              )}
            />
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Últimos Usuarios Registrados
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentUsers.length > 0 ? (
                            recentUsers.map((user) => (
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No hay registros recientes.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Últimos Suscriptores
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Fuente</TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentSubscribers.length > 0 ? (
                             recentSubscribers.map((subscriber) => (
                                <TableRow key={subscriber.id}>
                                    <TableCell>{subscriber.email}</TableCell>
                                     <TableCell>
                                        <Badge variant="outline">{subscriber.source || 'N/A'}</Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(subscriber.createdAt), 'dd MMM yyyy', { locale: es })}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="text-center">No hay registros recientes.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
