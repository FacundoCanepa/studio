
'use client';

import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Instagram, Menu, X, Facebook, LogOut, UserCircle, Pinterest } from 'lucide-react';
import type { CategoryDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import { AuthContext } from '@/context/auth-context';

interface AppHeaderProps {
  categories: CategoryDoc[];
}

export const AppHeader = ({ categories = [] }: AppHeaderProps) => {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const navLinks = [
    ...categories.map(c => ({ name: c.name, href: `/categoria/${c.slug}` })),
    { name: 'Artículos', href: '/articulos' },
    { name: 'Autores', href: '/autores' },
    { name: 'Quiénes Somos', href: '/quienes-somos' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe-top">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold font-headline tracking-tighter text-primary">
            VESTIGIO
          </Link>
        </div>
        
        <nav className="hidden lg:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-sm font-medium transition-colors hover:text-primary">
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end space-x-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm font-medium">{user.username}</span>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </>
          ) : (
             <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                    <UserCircle className="h-5 w-5 mr-2" />
                    Ingresar
                </Link>
             </Button>
          )}

          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] pt-safe-top pb-safe-bottom">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                   <Link href="/" className="text-2xl font-bold font-headline tracking-tighter text-primary">
                     VESTIGIO
                   </Link>
                   <Button variant="ghost" size="icon" onClick={() => setSheetOpen(false)}>
                      <X className="h-6 w-6" />
                      <span className="sr-only">Cerrar menú</span>
                   </Button>
                </div>
                <nav className="flex flex-col space-y-4 p-4">
                  {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} onClick={() => setSheetOpen(false)} className="text-lg font-medium transition-colors hover:text-primary">
                      {link.name}
                    </Link>
                  ))}
                </nav>
                 <div className="mt-auto p-4 border-t">
                    <div className="flex items-center justify-center space-x-4">
                        <a href="#" className="social-container instagram" aria-label="Instagram"><Instagram className="h-6 w-6 social-svg"/></a>
                         <a href="#" className="social-container pinterest" aria-label="Pinterest">
                            <Pinterest className="social-svg h-6 w-6" />
                        </a>
                        <a href="#" className="social-container tiktok" aria-label="TikTok">
                            <svg className="social-svg h-6 w-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                            </svg>
                        </a>
                        <a href="#" className="social-container facebook" aria-label="Facebook">
                          <Facebook className="social-svg h-6 w-6" />
                        </a>
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
