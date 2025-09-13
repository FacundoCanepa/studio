import * as React from 'react';
import type { Metadata } from 'next';
import { AboutSection } from '@/components/shared/about-section';

// Esto eventualmente vendrá de Firestore/CMS
const pageData = {
  seoTitle: "Quiénes Somos | VESTIGIO",
  seoDescription: "Conocé la visión de Vestigio: minimalismo, moda y mentalidad para vestir mejor con menos.",
  ogImage: "https://picsum.photos/seed/about-og/1200/630",
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageData.seoTitle,
    description: pageData.seoDescription,
    openGraph: {
      title: pageData.seoTitle,
      description: pageData.seoDescription,
      images: [
        {
          url: pageData.ogImage,
          width: 1200,
          height: 630,
          alt: 'La esencia de Vestigio',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageData.seoTitle,
      description: pageData.seoDescription,
      images: [pageData.ogImage],
    },
  };
}

export default function QuienesSomosPage() {
  return (
    <main>
      <AboutSection />
    </main>
  );
}
