
'use client';

import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Instagram, Menu, LogOut, UserCircle, Bookmark, Shield } from 'lucide-react';
import type { CategoryDoc } from '@/lib/firestore-types';
import Link from 'next/link';
import { AuthContext } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from '../theme/theme-toggle';


interface AppHeaderProps {
  categories: CategoryDoc[];
}

export const AppHeader = ({ categories = [] }: AppHeaderProps) => {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { user, logout, isAdmin } = useContext(AuthContext);

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
           <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    <span className="hidden sm:inline">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                    <DropdownMenuItem asChild>
                       <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                       </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                   <Link href="/guardados">
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>Mis Guardados</span>
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                </div>
                <nav className="flex flex-col space-y-4 p-4">
                  {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} onClick={() => setSheetOpen(false)} className="text-lg font-medium transition-colors hover:text-primary">
                      {link.name}
                    </Link>
                  ))}
                   {user && (
                        <Link href="/guardados" onClick={() => setSheetOpen(false)} className="text-lg font-medium transition-colors hover:text-primary">
                            Mis Guardados
                        </Link>
                    )}
                    {isAdmin && (
                        <Link href="/admin" onClick={() => setSheetOpen(false)} className="text-lg font-medium transition-colors hover:text-primary">
                            Admin Panel
                        </Link>
                    )}
                </nav>
                 <div className="mt-auto p-4 border-t">
                    <div className="flex items-center justify-center space-x-4">
                        <a href="#" className="social-container instagram" aria-label="Instagram"><Instagram className="h-6 w-6 social-svg"/></a>
                         <a href="#" className="social-container pinterest" aria-label="Pinterest">
                            <svg className="social-svg h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path d="M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-157.8 0-89.7-66.4-153.2-150.7-153.2-109.9 0-169 81.3-169 166.4 0 26.8 9.3 58.7 21.5 78.4 2.1 3.4 1.7 1.8.4 6.9-1.5 5.7-4.9 19.5-6.1 24.3-1.6 6.3-5.5 8.3-11.6 6.5-49-14.8-82.5-63.7-82.5-120.3 0-99.3 83.2-181 199.1-181 105.1 0 185.3 75.4 185.3 170.9 0 102.3-64.4 182.2-161.7 182.2-46.9 0-85.5-24.2-101.8-51.5 0 0-22.9 91.3-27.2 108.4-15.3 61.5-59.4 120.5-59.4 120.5-25.6-114.7 22.1-332.9 22.1-332.9 64.9 29.8 101.4-44.6 101.4-103.3 0-51.8-37.9-94.4-96.5-94.4-69.2 0-111.8 51.1-111.8 119.2 0 19.1 7.7 38.4 16.9 52.6 1.7 2.6.2 5.5-1.2 7.7-6.3 9.7-22.9 33.1-22.9 33.1s-4.9-19.6-3.8-25.7c2.3-13.2 10.3-36.5 14.9-52.3 21.1-71.2 58.9-142.9 132.8-142.9 158.1 0 255.8 128.3 255.8 266.3z"/></svg>
                        </a>
                        <a href="#" className="social-container tiktok" aria-label="TikTok">
                            <svg className="social-svg h-6 w-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                            </svg>
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
