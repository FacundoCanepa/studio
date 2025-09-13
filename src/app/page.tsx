import { AnimatedHeadline } from '@/components/shared/animated-headline';
import { ArticleList } from '@/components/articles/article-list';
import { AdSlot } from '@/components/marketing/ad-slot';
import type { ArticleDoc, CategoryDoc } from '@/lib/firestore-types';
import { CategoryFilter } from '@/components/articles/category-filter';
import { getArticles, getCategories } from '@/lib/strapi-client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default async function HomePage() {
  const articles = await getArticles();
  const categories = await getCategories();

  const NavButtons = () => {
    const baseClasses = "inline-flex items-center rounded-full px-4 py-2 text-sm border transition-colors duration-200";
    const activeClasses = "bg-primary text-primary-foreground border-primary";
    const idleClasses = "bg-secondary/50 hover:bg-secondary border-transparent";
    return (
      <nav aria-label="Categorías" className="flex gap-3 flex-wrap">
        <Link href="/" className={cn(baseClasses, activeClasses)}>
          Todos
        </Link>
        {categories.map((c) => (
          <Link
            key={c.documentId}
            href={`/categoria/${c.slug}`}
            className={cn(baseClasses, idleClasses)}
          >
            {c.name}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section className="py-12 text-center">
        <AnimatedHeadline />
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          La revista de moda, estilo de vida y tendencias para la mujer moderna.
        </p>
      </section>

      <div className="space-y-12">
        <NavButtons />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <ArticleList articles={articles} />
            {articles.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p>No se encontraron artículos.</p>
              </div>
            )}
          </div>
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <h3 className="font-headline text-xl tracking-wider text-foreground/70">Publicidad</h3>
              <AdSlot className="h-96" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
