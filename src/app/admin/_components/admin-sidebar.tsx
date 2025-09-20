'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, Users, GanttChartSquare, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthContext } from '@/context/auth-context';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/articles', label: 'Artículos', icon: Newspaper },
  { href: '/admin/categories', label: 'Categorías', icon: GanttChartSquare },
  { href: '/admin/authors', label: 'Autores', icon: Users },
  { href: '/admin/galeria', label: 'Galería', icon: ImageIcon },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { user } = React.useContext(AuthContext);

  return (
    <aside className="w-64 flex-shrink-0 bg-background border-r">
      <div className="flex h-full flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold font-headline text-primary">Admin Panel</h2>
          {user && <p className="text-sm text-muted-foreground">Hola, {user.username}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-secondary',
                pathname.startsWith(item.href) && 'bg-secondary text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            Volver al sitio principal
          </Link>
        </div>
      </div>
    </aside>
  );
};
