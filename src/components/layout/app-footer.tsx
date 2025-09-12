import { Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import { TikTokIcon } from '@/components/icons/tiktok-icon';
import { AdSlot } from '../marketing/ad-slot';

export const AppFooter = () => {
  return (
    <footer className="bg-secondary/50 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-2xl font-headline text-primary">Vestigio</h3>
            <p className="text-foreground/70 mt-2">La esencia del estilo contemporáneo.</p>
            <div className="flex space-x-3 mt-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="TikTok">
                  <TikTokIcon className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <h4 className="font-headline text-lg mb-4">Únete a nuestra comunidad</h4>
            <NewsletterForm />
          </div>

          <div className="flex flex-col items-center md:items-end">
            <h4 className="font-headline text-lg mb-4 text-foreground/70">Publicidad</h4>
            <AdSlot className="h-24 w-full max-w-xs" />
          </div>
        </div>

        <div className="border-t py-6 text-center text-sm text-foreground/60">
          <p>&copy; {new Date().getFullYear()} Vestigio Magazine. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
