'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Facebook, Instagram, Menu, Search, X, PenSquare } from 'lucide-react';
import type { CategoryDoc } from '@/lib/firestore-types';

interface AppHeaderProps {
  categories: CategoryDoc[];
}

export const AppHeader = ({ categories = [] }: AppHeaderProps) => {
  const [isSheetOpen, setSheetOpen] = useState(false);

  const navLinks = [
    ...categories.map(c => ({ name: c.name, href: `/categoria/${c.slug}` })),
    { name: 'Autores', href: '/autores' },
    { name: 'Quiénes Somos', href: '/quienes-somos' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <a href="/" className="text-2xl font-headline font-bold text-primary">
            Vestigio
          </a>
        </div>
        
        <nav className="hidden lg:flex items-center space-x-6">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium transition-colors hover:text-primary">
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <a href="#" aria-label="Instagram"><Instagram className="h-5 w-5 text-foreground/70 hover:text-primary"/></a>
            <a href="#" aria-label="Pinterest"><PenSquare className="h-5 w-5 text-foreground/70 hover:text-primary"/></a>
            <a href="#" aria-label="Facebook"><Facebook className="h-5 w-5 text-foreground/70 hover:text-primary"/></a>
          </div>
          <div className="hidden sm:block relative w-48">
            <Input type="search" placeholder="Buscar..." className="h-9 pl-10" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                   <a href="/" className="text-2xl font-headline font-bold text-primary">Vestigio</a>
                   <Button variant="ghost" size="icon" onClick={() => setSheetOpen(false)}>
                      <X className="h-6 w-6" />
                      <span className="sr-only">Cerrar menú</span>
                   </Button>
                </div>
                <nav className="flex flex-col space-y-4 p-4">
                  {navLinks.map((link) => (
                    <a key={link.name} href={link.href} onClick={() => setSheetOpen(false)} className="text-lg font-medium transition-colors hover:text-primary">
                      {link.name}
                    </a>
                  ))}
                </nav>
                 <div className="mt-auto p-4 border-t">
                    <div className="flex items-center justify-center space-x-4">
                        <a href="#" aria-label="Instagram"><Instagram className="h-6 w-6 text-foreground/70 hover:text-primary"/></a>
                        <a href="#" aria-label="Pinterest"><PenSquare className="h-6 w-6 text-foreground/70 hover:text-primary"/></a>
                        <a href="#" aria-label="Facebook"><Facebook className="h-6 w-6 text-foreground/70 hover:text-primary"/></a>
                    </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
