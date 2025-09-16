import * as React from 'react';
import type { Metadata } from 'next';
import { getAuthors } from '@/lib/strapi-client';
import { AuthorCard } from '@/components/authors/author-card';
import { SectionTitle } from '@/components/shared/section-title';

export const metadata: Metadata = {
  title: 'Autores - Vestigio Magazine',
  description: 'Conoce al equipo de escritores y expertos detrás de Vestigio Magazine.',
};

export default async function AutoresPage() {
  const authors = await getAuthors({ cache: 'no-store' });

  return (
    <div className="bg-background">
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionTitle>Nuestro Equipo</SectionTitle>
        <p className="mt-4 text-center text-lg text-muted-foreground max-w-2xl mx-auto">
          Conoce a los expertos y apasionados de la moda y el estilo que dan vida a Vestigio.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16 mt-20">
          {authors.map((author) => (
            <AuthorCard key={author.documentId} author={author} />
          ))}
        </div>
      </section>
    </div>
  );
}
