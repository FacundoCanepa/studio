
import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME } from '@/lib/api-utils';
import { getFavoriteArticles, getFavoriteTags } from '@/lib/strapi-client';
import { SectionTitle } from '@/components/shared/section-title';
import { ArticleList } from '@/components/articles/article-list';
import type { Metadata } from 'next';
import { jwtVerify } from 'jose';
import { COOKIE_SECRET } from '@/lib/api-utils';
import Link from 'next/link';
import { Buffer } from 'buffer';

export const metadata: Metadata = {
    title: 'Mis Guardados - Vestigio Magazine',
    description: 'Tu colección personal de artículos e inspiración de Vestigio Magazine.',
};

async function getSessionData(): Promise<{ userId: number; token: string } | null> {
    const cookie = cookies().get(COOKIE_NAME);
    if (!cookie?.value) {
        console.log('[GuardadosPage] No session cookie found.');
        return null;
    }
    
    try {
        const { payload } = await jwtVerify(cookie.value, COOKIE_SECRET);
        const strapiToken = payload.token as string;
        if (!strapiToken) {
            console.error('[GuardadosPage] Strapi token not found in session cookie payload.');
            return null;
        }
        
        // Decode the Strapi JWT payload to get the user ID
        const decodedStrapiJwt = JSON.parse(Buffer.from(strapiToken.split('.')[1], 'base64').toString());
        const userId = decodedStrapiJwt.id;

        if (!userId) {
             console.error('[GuardadosPage] User ID not found in Strapi token.');
             return null;
        }

        return { userId, token: strapiToken };
    } catch (e) {
        console.error("[GuardadosPage] Failed to verify session cookie:", e);
        return null;
    }
}


export default async function GuardadosPage() {
    const session = await getSessionData();

    if (!session) {
        redirect('/login');
    }

    const { userId, token } = session;
    
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
