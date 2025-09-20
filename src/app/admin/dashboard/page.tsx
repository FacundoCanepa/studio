import { Metadata } from 'next';
import { getArticles, getAuthors, getCategories, getTags, getGalleryItems } from '@/lib/strapi-client';
import { performStrapiRequest } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Newspaper, Users, GanttChartSquare, Tag, Image as ImageIcon, UserCircle, Mail,
  CheckCircle, XCircle, Star, Home, Sparkles, TrendingUp, AlertTriangle, BookOpen, Link as LinkIcon, Youtube,
  FileText, ImageOff, Link2
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ArticleDoc, AuthorDoc, CategoryDoc, TagDoc, GalleryItemDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { DistributionCharts } from './_components/distribution-charts';
import Image from 'next/image';

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

async function fetchRecent(endpoint: string, fields: string[], populate?: any): Promise<any[]> {
  try {
    const query = qs({
      sort: 'createdAt:desc',
      pagination: { limit: 5 },
      fields: fields,
      populate: populate,
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

interface RecentItemsTableProps {
  title: string;
  items: any[];
  columns: { header: string; accessor: (item: any) => ReactNode }[];
  icon: React.ComponentType<{ className?: string }>;
}

const RecentItemsTable = ({ title, items, columns, icon: Icon }: RecentItemsTableProps) => (
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
            items.map((item, index) => (
              <TableRow key={item.id || index}>
                {columns.map(col => <TableCell key={col.header}>{col.accessor(item)}</TableCell>)}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center h-24">No hay datos recientes.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
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
  
  const authorsWithArticleCount = authors.map(author => ({
    ...author,
    articleCount: articles.filter(a => a.author?.documentId === author.documentId).length
  }));

  const categoriesWithArticleCount = categories.map(cat => ({
    ...cat,
    articleCount: articles.filter(a => a.category?.documentId === cat.documentId).length
  }));

  const tagsWithArticleCount = tags.map(tag => ({
    ...tag,
    articleCount: articles.filter(a => a.tags?.some(t => t.documentId === tag.documentId)).length
  }));

  // Data for charts
  const articlesByCategoryChartData = categories.map(cat => ({
    name: cat.name,
    value: articles.filter(a => a.category?.documentId === cat.documentId).length,
  })).filter(d => d.value > 0);

  const articlesByTagChartData = tags.map(tag => ({
    name: tag.name,
    value: articles.filter(a => a.tags?.some(t => t.documentId === tag.documentId)).length
  })).filter(d => d.value > 0);

  const stats = [
    { title: 'Total de Artículos', value: articles.length, icon: Newspaper, href: '/admin/articles' },
    { title: 'Total de Autores', value: authors.length, icon: Users, href: '/admin/authors' },
    { title: 'Total de Categorías', value: categories.length, icon: GanttChartSquare, href: '/admin/categories' },
    { title: 'Items en Galería', value: galleryItems.length, icon: ImageIcon, href: '/admin/galeria' },
    { title: 'Total de Etiquetas', value: tags.length, icon: Tag, href: '/admin/tags' },
    { title: 'Usuarios Registrados', value: totalUsers, icon: UserCircle },
    { title: 'Suscriptores', value: totalSubscribers, icon: Mail },
  ];
  
  const recent5Articles = articles.sort((a,b) => new Date(b.updatedAt || b.createdAt!).getTime() - new Date(a.updatedAt || a.createdAt!).getTime()).slice(0,5);
  const recent5GalleryItems = galleryItems.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* 1. Resumen Global */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>
      </section>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
            {/* 2. Estado de Artículos */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Newspaper />Estado de Artículos</CardTitle>
                         <CardDescription>Un vistazo rápido a los artículos y sus estados actuales.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-sm">
                            <div className="flex items-center gap-2"><CheckCircle className="text-green-500"/> Publicados: <span className="font-bold">{articleMetrics.published}</span></div>
                            <div className="flex items-center gap-2"><XCircle className="text-red-500"/> Borradores: <span className="font-bold">{articleMetrics.drafts}</span></div>
                            <div className="flex items-center gap-2"><Star className="text-yellow-500"/> Destacados: <span className="font-bold">{articleMetrics.featured}</span></div>
                            <div className="flex items-center gap-2"><Home className="text-blue-500"/> En Portada: <span className="font-bold">{articleMetrics.home}</span></div>
                            <div className="flex items-center gap-2"><Sparkles className="text-purple-500"/> Nuevos: <span className="font-bold">{articleMetrics.isNew}</span></div>
                            <div className="flex items-center gap-2"><TrendingUp className="text-indigo-500"/> Tendencias: <span className="font-bold">{articleMetrics.tendencias}</span></div>
                        </div>
                        <RecentItemsTable 
                            title="Últimos 5 Artículos Actualizados"
                            items={recent5Articles}
                            icon={Newspaper}
                            columns={[
                                { header: 'Título', accessor: item => <Link href={`/admin/articles/edit/${item.documentId}`} className="font-medium hover:underline">{item.title}</Link> },
                                { header: 'Categoría', accessor: item => item.category ? <Badge variant="secondary">{item.category.name}</Badge> : 'N/A'},
                                { header: 'Fecha', accessor: item => format(new Date(item.updatedAt || item.createdAt!), 'dd MMM yyyy', { locale: es }) },
                            ]}
                        />
                    </CardContent>
                </Card>
            </section>
            
            {/* 5. Distribución Visual */}
            <section>
                <DistributionCharts byCategory={articlesByCategoryChartData} byTag={articlesByTagChartData} />
            </section>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* 4. Relaciones (Autores) */}
              <section>
                <RecentItemsTable
                  title="Autores y sus Artículos"
                  icon={Users}
                  items={authorsWithArticleCount.sort((a,b) => b.articleCount - a.articleCount)}
                  columns={[
                    { header: 'Autor', accessor: item => <Link href={`/admin/authors/edit/${item.documentId}`} className="font-medium hover:underline">{item.name}</Link> },
                    { header: 'Artículos', accessor: item => <Badge variant="outline">{item.articleCount}</Badge> },
                  ]}
                />
              </section>

              {/* 4. Relaciones (Categorías) */}
              <section>
                 <RecentItemsTable
                  title="Categorías y sus Artículos"
                  icon={GanttChartSquare}
                  items={categoriesWithArticleCount.sort((a,b) => b.articleCount - a.articleCount)}
                  columns={[
                    { header: 'Categoría', accessor: item => <Link href={`/admin/categories/edit/${item.documentId}`} className="font-medium hover:underline">{item.name}</Link> },
                    { header: 'Artículos', accessor: item => <Badge variant="outline">{item.articleCount}</Badge> },
                  ]}
                />
              </section>
            </div>
            
            {/* 6. Galería */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon />Resumen de Galería</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                           {recent5GalleryItems.map(item => (
                                <Link key={item.id} href={`/admin/galeria/edit/${item.id}`}>
                                    <div className="aspect-square relative rounded-md overflow-hidden group">
                                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="150px" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                            <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
                                        </div>
                                    </div>
                                </Link>
                           ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>

        <div className="space-y-8">
            {/* 3. Cobertura de Contenido */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertTriangle />Cobertura de Contenido</CardTitle>
                        <CardDescription>Alertas sobre contenido que podría estar incompleto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Alert variant={incompleteArticles.noCover > 0 ? "destructive" : "default"}>
                            <ImageOff className="h-4 w-4" />
                            <AlertTitle>{incompleteArticles.noCover} artículos sin portada</AlertTitle>
                        </Alert>
                        <Alert variant={incompleteArticles.noSeo > 0 ? "destructive" : "default"}>
                            <Link2 className="h-4 w-4" />
                            <AlertTitle>{incompleteArticles.noSeo} artículos sin SEO básico</AlertTitle>
                        </Alert>
                         <Alert variant={authors.filter(a => !a.bio).length > 0 ? "destructive" : "default"}>
                            <Users className="h-4 w-4" />
                            <AlertTitle>{authors.filter(a => !a.bio).length} autores sin biografía</AlertTitle>
                        </Alert>
                         <Alert variant={categories.filter(c => !c.description).length > 0 ? "destructive" : "default"}>
                            <GanttChartSquare className="h-4 w-4" />
                            <AlertTitle>{categories.filter(c => !c.description).length} categorías sin descripción</AlertTitle>
                        </Alert>
                    </CardContent>
                </Card>
            </section>

             {/* 7. Suscriptores y Usuarios */}
             <section>
                <RecentItemsTable
                    title="Últimos Usuarios"
                    icon={UserCircle}
                    items={recentUsers}
                    columns={[
                        { header: "Usuario", accessor: (item) => item.username },
                        { header: "Estado", accessor: (item) => <Badge variant={item.confirmed ? "default" : "secondary"}>{item.confirmed ? "Activo" : "Pendiente"}</Badge> },
                    ]}
                />
             </section>
             <section>
                <RecentItemsTable
                    title="Últimos Suscriptores"
                    icon={Mail}
                    items={recentSubscribers}
                    columns={[
                        { header: "Email", accessor: (item) => item.email },
                        { header: "Fuente", accessor: (item) => <Badge variant="outline">{item.source || 'N/A'}</Badge>},
                    ]}
                />
             </section>
        </div>
      </div>
    </div>
  );
}
