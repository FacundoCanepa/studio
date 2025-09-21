
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdSlot } from '../marketing/ad-slot';
import Image from 'next/image';
import Link from 'next/link';

export const AppFooter = () => {
  return (
    <footer className="bg-secondary/50 mt-20 pt-safe-top pb-safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-16">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-2xl font-bold font-headline tracking-tighter text-primary">VESTIGIO</h3>
            <p className="text-foreground/70 mt-2">La esencia del estilo contemporáneo.</p>
             {/* [UI/UX FIX]: Use same social follow component as header for consistency */}
            <div className="flex space-x-2 mt-4">
              <a href="#" className="social-container instagram" aria-label="Instagram">
                <Instagram className="social-svg" />
              </a>
              <a href="#" className="social-container pinterest" aria-label="Pinterest">
                 <svg className="social-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path d="M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-157.8 0-89.7-66.4-153.2-150.7-153.2-109.9 0-169 81.3-169 166.4 0 26.8 9.3 58.7 21.5 78.4 2.1 3.4 1.7 1.8.4 6.9-1.5 5.7-4.9 19.5-6.1 24.3-1.6 6.3-5.5 8.3-11.6 6.5-49-14.8-82.5-63.7-82.5-120.3 0-99.3 83.2-181 199.1-181 105.1 0 185.3 75.4 185.3 170.9 0 102.3-64.4 182.2-161.7 182.2-46.9 0-85.5-24.2-101.8-51.5 0 0-22.9 91.3-27.2 108.4-15.3 61.5-59.4 120.5-59.4 120.5-25.6-114.7 22.1-332.9 22.1-332.9 64.9 29.8 101.4-44.6 101.4-103.3 0-51.8-37.9-94.4-96.5-94.4-69.2 0-111.8 51.1-111.8 119.2 0 19.1 7.7 38.4 16.9 52.6 1.7 2.6.2 5.5-1.2 7.7-6.3 9.7-22.9 33.1-22.9 33.1s-4.9-19.6-3.8-25.7c2.3-13.2 10.3-36.5 14.9-52.3 21.1-71.2 58.9-142.9 132.8-142.9 158.1 0 255.8 128.3 255.8 266.3z"/></svg>
              </a>
               <a href="#" className="social-container tiktok" aria-label="TikTok">
                  <svg className="social-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>
                </a>
              <a href="#" className="social-container facebook" aria-label="Facebook">
                <Facebook className="social-svg" />
              </a>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <h4 className="font-headline text-lg mb-4 text-foreground/70">Publicidad</h4>
            <AdSlot className="h-24 w-full max-w-xs" />
          </div>
        </div>

        <div className="border-t py-6 text-center text-sm text-foreground/60 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Vestigio Magazine. Todos los derechos reservados.</p>
           <div className="flex items-center gap-4">
              <Link href="/terminos-y-condiciones" className="hover:text-primary transition-colors">
                Términos y Condiciones
              </Link>
              <Link href="/politica-de-privacidad" className="hover:text-primary transition-colors">
                Política de Privacidad
              </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
