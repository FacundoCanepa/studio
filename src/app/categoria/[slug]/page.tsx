import { ArticleList } from "@/components/articles/article-list";
import { AdSlot } from "@/components/marketing/ad-slot";
import { getArticles, getCategories } from "@/lib/strapi-client";
import type { Metadata } from "next";
import Link from 'next/link';
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const categories = await getCategories();
  const category = categories.find(c => c.slug === slug);
  const categoryName = category?.name || slug.replace(/-/g, ' ');

  return {
    title: `${categoryName} - Vestigio Magazine`,
    description: `Artículos y noticias sobre ${categoryName}.`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  const articles = await getArticles({ categorySlug: slug });
  const categories = await getCategories();
  const category = categories.find(c => c.slug === slug);

  const NavButtons = () => {
    const baseClasses = "inline-flex items-center rounded-full px-4 py-2 text-sm border transition-colors duration-200";
    const activeClasses = "bg-primary text-primary-foreground border-primary";
    const idleClasses = "bg-secondary/50 hover:bg-secondary border-transparent";
    return (
      <nav aria-label="Categorías" className="flex gap-3 flex-wrap">
        <Link href="/" className={cn(baseClasses, idleClasses)}>
          Todos
        </Link>
        {categories.map((c) => (
          <Link
            key={c.documentId}
            href={`/categoria/${c.slug}`}
            className={cn(
              baseClasses,
              slug === c.slug ? activeClasses : idleClasses
            )}
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
        <h1 className="text-6xl md:text-8xl font-headline font-medium tracking-tighter uppercase">
          {category?.name || slug}
        </h1>
      </section>

      <div className="space-y-12">
        <NavButtons />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <ArticleList articles={articles} />
            {articles.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p>No hay artículos en esta categoría por el momento.</p>
              </div>
            )}
          </div>
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <h3 className="font-headline text-xl tracking-wider text-foreground/70">Publicidad</h3>
              <AdSlot className="h-96" />
              <AdSlot className="h-64 mt-8" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const categories = await getCategories();
 
  return categories.map((category) => ({
    slug: category.slug,
  }));
}
