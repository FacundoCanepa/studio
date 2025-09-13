import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Instagram } from 'lucide-react';
import { aboutPageContent } from '@/lib/data'; // Usamos datos de muestra por ahora

export const AboutSection = () => {
  const { title, subtitle, content, heroImage } = aboutPageContent;

  return (
    <div className="bg-background">
      <section className="relative h-[60vh] min-h-[400px] text-white flex items-center justify-center text-center">
        {heroImage && (
          <Image
            src={heroImage}
            alt="Nuestra Misión en Vestigio"
            fill
            className="object-cover"
            priority
            data-ai-hint="office background"
          />
        )}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div className="relative z-10 p-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-headline font-medium tracking-tighter uppercase">
            {title}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/80">
            {subtitle}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <div className="prose prose-lg dark:prose-invert prose-headings:font-headline prose-headings:text-primary prose-a:text-primary hover:prose-a:underline">
            {content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n').map(item => item.substring(2));
                return (
                  <ul key={index} className="list-disc pl-6 space-y-2">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                );
              }
              if (paragraph.startsWith('**')) {
                return <p key={index}><strong>{paragraph.replace(/\*\*/g, '')}</strong></p>
              }
              return <p key={index}>{paragraph}</p>;
            })}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <a href="https://www.instagram.com/vestigio.et" target="_blank" rel="noopener noreferrer">
                <Instagram className="mr-2 h-5 w-5" />
                Seguí a @vestigio.et
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
