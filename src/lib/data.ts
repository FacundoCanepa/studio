
import type { ArticleDoc } from './firestore-types';

export const articles: ArticleDoc[] = [
  {
    documentId: '1',
    title: 'Guardarropa cápsula de primavera: 10 prendas clave',
    slug: 'guardarropa-capsula-primavera',
    excerpt: 'Una guía práctica para armar un armario minimalista y versátil con solo 10 prendas que combinan entre sí para cualquier ocasión.',
    publishedAt: '2025-09-13T10:00:00Z',
    category: { documentId: 'cat-1', name: 'Estilo de vida', slug: 'estilo-de-vida' },
    coverUrl: 'https://picsum.photos/seed/style1/600/400',
    author: { documentId: 'author-1', name: 'Juan Pérez', avatarUrl: 'https://picsum.photos/seed/juan/100/100' },
    tags: [{ documentId: 'tag-1', name: 'Moda', slug: 'moda' }],
  },
  {
    documentId: '2',
    title: 'Cómo combinar un blazer azul marino',
    slug: 'como-combinar-blazer-azul-marino',
    excerpt: 'Guía rápida para usar un blazer azul marino en distintos contextos, desde lo casual a lo formal.',
    publishedAt: '2025-09-12T11:00:00Z',
    category: { documentId: 'cat-2', name: 'Tips', slug: 'tips' },
    coverUrl: 'https://picsum.photos/seed/blazer/600/400',
    author: { documentId: 'author-2', name: 'Ana García', avatarUrl: 'https://picsum.photos/seed/ana/100/100' },
    tags: [{ documentId: 'tag-1', name: 'Moda', slug: 'moda' }],
  },
  {
    documentId: '3',
    title: 'Los accesorios que definen el 2025',
    slug: 'accesorios-2025',
    excerpt: 'Relojes, pulseras y gafas de sol que marcarán tendencia y elevarán tu estilo al siguiente nivel.',
    publishedAt: '2025-09-11T12:00:00Z',
    category: { documentId: 'cat-3', name: 'Accesorios', slug: 'accesorios' },
    coverUrl: 'https://picsum.photos/seed/accesories/600/400',
    author: { documentId: 'author-1', name: 'Juan Pérez', avatarUrl: 'https://picsum.photos/seed/juan/100/100' },
    tags: [{ documentId: 'tag-2', name: 'Tendencias', slug: 'tendencias' }],
  },
  {
    documentId: '4',
    title: 'Temporada de lino: frescura y elegancia',
    slug: 'temporada-lino',
    excerpt: 'Descubre por qué el lino es el tejido perfecto para el verano y cómo incorporarlo en tu día a día.',
    publishedAt: '2025-09-10T13:00:00Z',
    category: { documentId: 'cat-4', name: 'Temporadas', slug: 'temporadas' },
    coverUrl: 'https://picsum.photos/seed/linen/600/400',
    author: { documentId: 'author-3', name: 'Carlos Ruiz', avatarUrl: 'https://picsum.photos/seed/carlos/100/100' },
    tags: [{ documentId: 'tag-3', name: 'Verano', slug: 'verano' }],
  },
  {
    documentId: '5',
    title: 'El arte del cuidado de la barba',
    slug: 'cuidado-barba',
    excerpt: 'Productos y rutinas esenciales para mantener una barba saludable, definida y con estilo.',
    publishedAt: '2025-09-09T14:00:00Z',
    category: { documentId: 'cat-2', name: 'Tips', slug: 'tips' },
    coverUrl: 'https://picsum.photos/seed/beard/600/400',
    author: { documentId: 'author-2', name: 'Ana García', avatarUrl: 'https://picsum.photos/seed/ana/100/100' },
    tags: [{ documentId: 'tag-4', name: 'Grooming', slug: 'grooming' }],
  },
  {
    documentId: '6',
    title: 'Inversiones para principiantes: Old Money Style',
    slug: 'inversiones-old-money',
    excerpt: 'Una introducción a las finanzas personales con un enfoque en la creación de riqueza generacional.',
    publishedAt: '2025-09-08T15:00:00Z',
    category: { documentId: 'cat-1', name: 'Estilo de vida', slug: 'estilo-de-vida' },
    coverUrl: 'https://picsum.photos/seed/money/600/400',
    author: { documentId: 'author-3', name: 'Carlos Ruiz', avatarUrl: 'https://picsum.photos/seed/carlos/100/100' },
    tags: [{ documentId: 'tag-5', name: 'Finanzas', slug: 'finanzas' }],
  },
    {
    documentId: '7',
    title: 'Los mejores destinos para un viaje en solitario',
    slug: 'destinos-viaje-solitario',
    excerpt: 'Explora lugares increíbles y seguros para tu próxima aventura, donde podrás desconectar y conocerte a ti mismo.',
    publishedAt: '2025-09-07T16:00:00Z',
    category: { documentId: 'cat-1', name: 'Estilo de vida', slug: 'estilo-de-vida' },
    coverUrl: 'https://picsum.photos/seed/travel/600/400',
    author: { documentId: 'author-1', name: 'Juan Pérez', avatarUrl: 'https://picsum.photos/seed/juan/100/100' },
    tags: [{ documentId: 'tag-6', name: 'Viajes', slug: 'viajes' }],
  },
];


export const aboutPageContent = {
  title: "Quiénes somos",
  subtitle: "Minimalismo, moda y mentalidad. Vestigio es una guía práctica para vestir mejor con menos.",
  heroImage: "https://picsum.photos/seed/about/1920/1080",
  content: `**Vestigio** nace con una idea simple: ayudarte a construir un estilo propio, sobrio y funcional. 
Curamos looks, enseñamos combinaciones y diseñamos prendas atemporales que se adaptan a tu día a día.

- Apuesta por lo esencial: menos ruido, más intención.
- Paleta neutra y cortes limpios.
- Educación primero: tips, guías y comparativas reales.

Esto es una comunidad. Si te suma, quedate: hay mucho por construir juntos.`,
};
