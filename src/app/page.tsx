import { AnimatedHeadline } from '@/components/shared/animated-headline';
import { ArticleList } from '@/components/articles/article-list';
import { AdSlot } from '@/components/marketing/ad-slot';
import { getArticles, getCategories } from '@/lib/strapi-client';
import type { ArticleDoc, CategoryDoc } from '@/lib/firestore-types';

export default async function Home() {
  const BYPASS_FIRESTORE = process.env.NODE_ENV === 'development';
  let articles: ArticleDoc[] = [];
  let categories: CategoryDoc[] = [];
  let emptyReason = 'no-items-from-strapi';

  if (BYPASS_FIRESTORE) {
    console.log('[TEST][BYPASS_FIRESTORE] enabled');
  }

  try {
    articles = await getArticles();
    categories = await getCategories();
    if (BYPASS_FIRESTORE) {
      console.log('[TEST][BYPASS][STRAPI][COUNT]', articles.length);
    }
  } catch (error: any) {
    console.log('[UI][Home][ERROR]', { message: error?.message, stack: error?.stack });
    emptyReason = error.message;
  }
  
  console.log('[UI][Home][PROPS]', { articlesLen: articles?.length, categoriesLen: categories?.length });
  
  console.log('[ARTICLES][UI][PROPS]', { len: articles?.length });
  articles?.forEach((a,i) => {
    console.log("[ARTICLES][UI][ITEM]", i, { slug: a.slug, documentId: a.documentId, title: a.title });
  });

  const safeArticles = Array.isArray(articles) ? articles.filter(Boolean) : [];

  if (safeArticles.length === 0) {
     console.log('[UI][Home][RENDER_STATE]', 'EMPTY_LIST');
     console.log('[UI][Home][EMPTY_REASON]', emptyReason);
  } else {
     console.log('[UI][Home][RENDER_STATE]', 'rendering-list');
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <section className="py-24 text-center">
        <AnimatedHeadline />
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          La revista de moda, estilo de vida y tendencias para la mujer moderna.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <ArticleList articles={safeArticles} categories={categories} />
        </div>
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <h3 className="font-headline text-xl tracking-wider text-foreground/70">Publicidad</h3>
            <AdSlot className="h-96" />
          </div>
        </aside>
      </div>
    </div>
  );
}
