import { AnimatedHeadline } from '@/components/shared/animated-headline';
import { ArticleList } from '@/components/articles/article-list';
import { AdSlot } from '@/components/marketing/ad-slot';
import { getArticles, getCategories } from '@/lib/strapi-client';

export default async function Home() {
  const articles = await getArticles();
  const categories = await getCategories();

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
          <ArticleList articles={articles} categories={categories} />
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
