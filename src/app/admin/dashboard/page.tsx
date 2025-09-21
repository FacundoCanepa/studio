

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as React from 'react';

import { getArticles, getAuthors, getCategories, getTags, getGalleryItems } from '@/lib/strapi-client';
import { performStrapiRequest } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';
import type { ArticleDoc, AuthorDoc, CategoryDoc, GalleryItemDoc, TagDoc, StrapiUser } from '@/lib/firestore-types';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SummaryCard } from './_components/summary-card';
import { RecentItemsCard } from './_components/recent-items-card';
import { ContentHealthCard } from './_components/content-health-card';
import { DistributionCharts } from './_components/distribution-charts';
import { AnalyticsSummary } from './_components/analytics-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { TrafficChart } from './_components/traffic-chart';
import { TopPagesChart } from './_components/top-pages-chart';


import {
  Newspaper, Users, GanttChartSquare, Tag, Image as ImageIcon, UserCircle,
  CheckCircle, XCircle, Star, Home, Sparkles, TrendingUp, ServerCrash, Bookmark, BarChart3, Eye, TrendingDown
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard - Admin Panel',
};

export const revalidate = 0;

// --- Data Fetching Helpers ---

async function fetchTotalCount(endpoint: string): Promise<number> {
  try {
    const query = qs({ pagination: { pageSize: 1 } });
    const response = await performStrapiRequest(`${endpoint}${query}`, { method: 'GET', cache: 'no-store' });
    
    if (Array.isArray(response)) {
      return response.length;
    }

    const totalFromMeta = response?.meta?.pagination?.total;
    if (typeof totalFromMeta === 'number') {
      return totalFromMeta;
    }

    if (Array.isArray(response?.data)) {
      return response.data.length;
    }

    return 0;
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
      fields,
      populate,
    });
    const response = await performStrapiRequest(`${endpoint}${query}`, { method: 'GET', cache: 'no-store' });
    if (Array.isArray(response)) {
      return response;
    }

    return response.data ?? [];
  } catch (error) {
    console.error(`[DASHBOARD] Error fetching recent items from ${endpoint}:`, error);
    return [];
  }
}

async function fetchAllUsersWithFavorites(): Promise<StrapiUser[]> {
    try {
        const query = qs({
            populate: ['favorite_articles', 'favorite_tags'],
            pagination: { limit: -1 }
        });
        const response = await performStrapiRequest(`/api/users${query}`, { method: 'GET', cache: 'no-store' });
        if (Array.isArray(response)) {
          return response;
        }

        if (Array.isArray(response?.data)) {
          return response.data;
        }

        return [];
    } catch (error) {
        console.error('[DASHBOARD] Error fetching all users with favorites:', error);
        return [];
    }
}


type FavoriteRelationKey = 'favorite_articles' | 'favorite_tags';
type FavoriteRelationItem = { id: number } & Record<string, any>;

function normalizeFavoriteRelationItem(item: any): FavoriteRelationItem | null {
  if (item == null) {
    return null;
  }

  if (typeof item === 'number') {
    return { id: item };
  }

  if (typeof item === 'object') {
    const maybeAttributes = (item as any).attributes;
    const rawId = (item as any).id ?? maybeAttributes?.id;
    const parsedId = typeof rawId === 'number'
      ? rawId
      : typeof rawId === 'string'
        ? Number.parseInt(rawId, 10)
        : undefined;

    if (typeof parsedId !== 'number' || Number.isNaN(parsedId)) {
      return null;
    }

    const base = maybeAttributes && typeof maybeAttributes === 'object'
      ? maybeAttributes
      : item;

    const normalized = { ...(base as Record<string, any>) };
    delete (normalized as any).attributes;
    normalized.id = parsedId;

    return normalized as FavoriteRelationItem;
  }

  return null;
}

function extractFavoriteRelationItems(entity: any, key: FavoriteRelationKey): FavoriteRelationItem[] {
  if (!entity) {
    return [];
  }

  const relation = entity[key] ?? entity.attributes?.[key];
  if (!relation) {
    return [];
  }

  const items = Array.isArray(relation) ? relation : relation?.data;
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(normalizeFavoriteRelationItem)
    .filter((item): item is FavoriteRelationItem => !!item && typeof item.id === 'number' && Number.isFinite(item.id));
}


export default async function AdminDashboardPage() {
  let articles: ArticleDoc[], authors: AuthorDoc[], categories: CategoryDoc[], tags: TagDoc[], galleryItems: GalleryItemDoc[], allUsers: StrapiUser[], totalUsers: number, recentUsers: any[];

  try {
    const [
      articlesData,
      authorsData,
      categoriesData,
      tagsData,
      galleryItemsData,
      totalUsersData,
      recentUsersData,
      allUsersData,
    ] = await Promise.all([
      getArticles({ limit: -1 }),
      getAuthors({ cache: 'no-store' }),
      getCategories({ cache: 'no-store' }),
      getTags(),
      getGalleryItems(),
      fetchTotalCount('/api/users'),
      fetchRecent('/api/users', ['username', 'email', 'createdAt', 'confirmed'], ['favorite_articles', 'favorite_tags']),
      fetchAllUsersWithFavorites(),
    ]);

    articles = articlesData;
    authors = authorsData;
    categories = categoriesData;
    tags = tagsData;
    galleryItems = galleryItemsData;
    totalUsers = totalUsersData;
    recentUsers = recentUsersData;
    allUsers = allUsersData;

  // --- Metrics Calculation ---
  const articleMetrics = {
    published: articles.filter(a => a.publishedAt).length,
    drafts: articles.filter(a => !a.publishedAt).length,
    featured: articles.filter(a => a.featured).length,
    home: articles.filter(a => a.home).length,
    isNew: articles.filter(a => a.isNew).length,
    tendencias: articles.filter(a => a.tendencias).length,
  };
  
  const healthMetrics = {
    noCover: articles.filter(a => !a.coverUrl).length,
    noSeo: articles.filter(a => !a.seo?.metaTitle || !a.seo?.metaDescription).length,
    authorsWithoutBio: authors.filter(a => !a.bio).length,
    categoriesWithoutDescription: categories.filter(c => !c.description).length,
  };

  const authorsWithArticleCount = authors.map(author => ({
    ...author,
    articleCount: articles.filter(a => a.author?.documentId === author.documentId).length
  }));

  const categoriesWithArticleCount = categories.map(cat => ({
    ...cat,
    articleCount: articles.filter(a => a.category?.documentId === cat.documentId).length
  }));

  // Most saved articles and tags
  const articleSaveCounts = new Map<number, number>();
  const tagSaveCounts = new Map<number, number>();
  const favoriteArticleMetadata = new Map<number, { title?: string; slug?: string; documentId?: string }>();
  const favoriteTagMetadata = new Map<number, { name?: string; slug?: string }>();
  
  allUsers.forEach(user => {
    user.favorite_articles?.forEach(article => {
        if (article.id) {
            articleSaveCounts.set(article.id, (articleSaveCounts.get(article.id) || 0) + 1);
        }
    });
    user.favorite_tags?.forEach(tag => {
        if (tag.id) {
            tagSaveCounts.set(tag.id, (tagSaveCounts.get(tag.id) || 0) + 1);
        }
    });
  });

  const topSavedArticles = Array.from(articleSaveCounts.entries())
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5)
    .map(([articleId, count]) => {
        const article = articles.find(a => a.id === articleId);
        return {
            title: article?.title || `Artículo ID: ${articleId}`,
            slug: article?.slug,
            count
        };
    });

    const topSavedTags = Array.from(tagSaveCounts.entries())
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5)
    .map(([tagId, count]) => {
        const tag = tags.find(t => t.id === tagId);
        return {
            name: tag?.name || `Tag ID: ${tagId}`,
            slug: tag?.slug,
            count
        };
    });


  // Data for charts
  const articlesByCategoryChartData = categories.map(cat => ({
    name: cat.name,
    value: articles.filter(a => a.category?.documentId === cat.documentId).length,
  })).filter(d => d.value > 0);

  const articlesByTagChartData = tags.map(tag => ({
    name: tag.name,
    value: articles.filter(a => a.tags?.some(t => t.documentId === tag.documentId)).length
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const stats = [
    { title: 'Total de Artículos', value: articles.length, icon: Newspaper, href: '/admin/articles' },
    { title: 'Total de Autores', value: authors.length, icon: Users, href: '/admin/authors' },
    { title: 'Total de Categorías', value: categories.length, icon: GanttChartSquare, href: '/admin/categories' },
    { title: 'Items en Galería', value: galleryItems.length, icon: ImageIcon, href: '/admin/galeria' },
    { title: 'Total de Etiquetas', value: tags.length, icon: Tag, href: '/admin/tags' },
    { title: 'Usuarios Registrados', value: totalUsers, icon: UserCircle },
  ];
  
  const recent5Articles = articles.sort((a,b) => new Date(b.updatedAt || b.createdAt!).getTime() - new Date(a.updatedAt || a.createdAt!).getTime()).slice(0,5);
  const recent5GalleryItems = galleryItems.slice(0, 5);
  
  const AnalyticsSkeleton = () => (
    <>
        <SummaryCard title="Visitantes (7d)" value={<Skeleton className="h-6 w-16" />} icon={Users} description="Cargando..." />
        <SummaryCard title="Páginas Vistas (7d)" value={<Skeleton className="h-6 w-20" />} icon={Eye} description="Cargando..." />
        <SummaryCard title="Tasa de Rebote (7d)" value={<Skeleton className="h-6 w-12" />} icon={TrendingDown} description="Cargando..." />
    </>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* 1. Resumen Global */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {stats.map(stat => <SummaryCard key={stat.title} {...stat} />)}
        </div>
      </section>

      {/* Analytics Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Analíticas de Tráfico</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <React.Suspense fallback={<AnalyticsSkeleton />}>
                <AnalyticsSummary />
            </React.Suspense>
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
                        <RecentItemsCard
                            title="Últimos 5 Artículos Actualizados"
                            items={recent5Articles}
                            icon={Newspaper}
                            columns={[
                                { header: 'Título', accessor: (item: ArticleDoc) => <Link href={`/admin/articles/edit/${item.documentId}`} className="font-medium hover:underline">{item.title}</Link> },
                                { header: 'Categoría', accessor: (item: ArticleDoc) => item.category ? <Badge variant="secondary">{item.category.name}</Badge> : 'N/A'},
                                { header: 'Fecha', accessor: (item: ArticleDoc) => format(new Date(item.updatedAt || item.createdAt!), 'dd MMM yyyy', { locale: es }) },
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
               <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bookmark />Artículos Más Guardados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {topSavedArticles.map((article, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                    <Link href={`/articulos/${article.slug}`} className="hover:underline truncate pr-4" title={article.title}>{article.title}</Link>
                                    <Badge variant="outline">{article.count}</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Tag />Etiquetas Más Populares</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3">
                            {topSavedTags.map((tag, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                    <Link href={`/articulos?tag=${tag.slug}`} className="hover:underline">{tag.name}</Link>
                                    <Badge variant="outline">{tag.count}</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
            
            {/* 6. Galería */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon />Resumen de Galería</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recent5GalleryItems.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                           {recent5GalleryItems.map((item: GalleryItemDoc) => (
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
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay elementos en la galería.</p>
                      )}
                    </CardContent>
                </Card>
            </section>
        </div>

        <div className="space-y-8">
            {/* 3. Cobertura de Contenido */}
            <section>
                <ContentHealthCard metrics={healthMetrics} />
            </section>

             {/* 7. Usuarios */}
             <section>
                <RecentItemsCard
                    title="Últimos Usuarios Registrados"
                    icon={UserCircle}
                    items={recentUsers}
                    columns={[
                        { header: "Usuario", accessor: (item: any) => item.attributes?.username || item.username },
                        { header: "Estado", accessor: (item: any) => <Badge variant={item.attributes?.confirmed || item.confirmed ? "default" : "secondary"}>{item.attributes?.confirmed || item.confirmed ? "Activo" : "Pendiente"}</Badge> },
                    ]}
                />
             </section>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error("[DASHBOARD_ERROR] Failed to fetch initial data:", error);
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Alert variant="destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Error al Cargar el Dashboard</AlertTitle>
          <AlertDescription>
            No se pudieron obtener los datos necesarios desde Strapi. Por favor, verifica que el servicio esté funcionando y que las variables de entorno (`NEXT_PUBLIC_STRAPI_URL` y `STRAPI_API_TOKEN`) estén configuradas correctamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
