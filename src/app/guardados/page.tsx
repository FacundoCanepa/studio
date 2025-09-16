
import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, getJwtFromCookie } from '@/lib/api-utils';
import { getFavoriteArticles, getFavoriteTags } from '@/lib/strapi-client';
import { SectionTitle } from '@/components/shared/section-title';
import { ArticleList } from '@/components/articles/article-list';
import type { Metadata } from 'next';
import { jwtVerify } from 'jose';
import { COOKIE_SECRET } from '@/lib/api-utils';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Mis Guardados - Vestigio Magazine',
    description: 'Tu colección personal de artículos e inspiración de Vestigio Magazine.',
};

async function getUserIdFromCookie(): Promise<number | null> {
    const cookie = cookies().get(COOKIE_NAME);
    if (!cookie) return null;
    
    try {
        const { payload } = await jwtVerify(cookie.value, COOKIE_SECRET);
        const strapiJwt = payload.token as string;
        if (!strapiJwt) return null;
        
        // Decoding the JWT payload to get the user ID
        const decodedStrapiJwt = JSON.parse(Buffer.from(strapiJwt.split('.')[1], 'base64').toString());
        return decodedStrapiJwt.id;
    } catch (e) {
        console.error("Failed to verify session cookie:", e);
        return null;
    }
}


export default async function GuardadosPage() {
    const cookie = cookies().get(COOKIE_NAME)?.value;
    const token = await getJwtFromCookie({ cookies: { get: () => cookie } } as any);

    if (!token) {
        redirect('/login');
    }

    const userId = await getUserIdFromCookie();
    if (!userId) {
        // This case can happen if the cookie is invalid or expired.
        // Redirecting to login is a safe fallback.
        redirect('/login');
    }
    
    const [favoriteArticles, favoriteTags] = await Promise.all([
        getFavoriteArticles(userId, token),
        getFavoriteTags(userId, token)
    ]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <SectionTitle>Mis Guardados</SectionTitle>
            <p className="mt-4 text-center text-lg text-muted-foreground max-w-2xl mx-auto">
                Tu colección personal de inspiración y estilo.
            </p>

            <section className="mt-16">
                <h2 className="text-3xl font-headline mb-8">Artículos Guardados</h2>
                {favoriteArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ArticleList articles={favoriteArticles} />
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <p className="text-lg">Aún no has guardado ningún artículo.</p>
                        <p className="mt-2">Explora nuestras publicaciones y guarda las que más te inspiren.</p>
                    </div>
                )}
            </section>

             <section className="mt-24">
                <h2 className="text-3xl font-headline mb-8">Temas Guardados</h2>
                {favoriteTags.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {favoriteTags.map(tag => (
                             <Link
                                key={tag.documentId}
                                href={`/categoria/${tag.slug}`} 
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-base font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                                {tag.name}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <p className="text-lg">No tienes temas guardados.</p>
                        <p className="mt-2">Guarda etiquetas de los artículos para seguir los temas que te interesan.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
