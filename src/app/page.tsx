import { AnimatedHeadline } from '@/components/shared/animated-headline';
import { ArticleList } from '@/components/articles/article-list';
import { ImageGallery } from '@/components/shared/image-gallery';
import { RecommendedArticles } from '@/components/shared/recommended-articles';
import { AdSlot } from '@/components/marketing/ad-slot';
import { FadeIn } from '@/components/shared/fade-in';

export default function Home() {
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
          <ArticleList />
        </div>
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <h3 className="font-headline text-xl tracking-wider text-foreground/70">Publicidad</h3>
            <AdSlot className="h-96" />
          </div>
        </aside>
      </div>

      <FadeIn delay={500}>
        <section className="my-20">
          <AdSlot className="h-32 w-full max-w-4xl mx-auto" />
        </section>
      </FadeIn>

      <FadeIn delay={200}>
        <section className="my-20">
          <h2 className="text-4xl font-headline text-center mb-12">Desde Nuestro Instagram</h2>
          <ImageGallery />
        </section>
      </FadeIn>
      
      <FadeIn delay={200}>
        <section className="my-20">
          <h2 className="text-4xl font-headline text-center mb-12">Recomendado para Ti</h2>
          <RecommendedArticles />
        </section>
      </FadeIn>
    </div>
  );
}
