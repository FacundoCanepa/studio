import { Facebook, Instagram, Youtube, Pinterest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import { AdSlot } from '../marketing/ad-slot';
import Image from 'next/image';

export const AppFooter = () => {
  return (
    <footer className="bg-secondary/50 mt-20 pt-safe-top pb-safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-2xl font-bold font-headline tracking-tighter text-primary">VESTIGIO</h3>
            <p className="text-foreground/70 mt-2">La esencia del estilo contemporáneo.</p>
             {/* [UI/UX FIX]: Use same social follow component as header for consistency */}
            <div className="flex space-x-2 mt-4">
              <a href="#" className="social-container instagram" aria-label="Instagram">
                <Instagram className="social-svg" />
              </a>
              <a href="#" className="social-container pinterest" aria-label="Pinterest">
                <Pinterest className="social-svg" />
              </a>
               <a href="#" className="social-container tiktok" aria-label="TikTok">
                  <svg className="social-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>
                </a>
              <a href="#" className="social-container facebook" aria-label="Facebook">
                <Facebook className="social-svg" />
              </a>
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
