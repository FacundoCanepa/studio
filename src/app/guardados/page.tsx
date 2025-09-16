
import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, getJwtFromCookie } from '@/lib/api-utils';
import { getFavoriteArticles } from '@/lib/strapi-client';
import { SectionTitle } from '@/components/shared/section-title';
import { ArticleList } from '@/components/articles/article-list';
import type { Metadata } from 'next';
import { jwtVerify } from 'jose';
import { COOKIE_SECRET } from '@/lib/api-utils';
import type { StrapiUser } from '@/lib/strapi-types';

export const metadata: Metadata = {
    title: 'Mis Artículos Guardados',
    description: 'Tu colección personal de artículos de Vestigio Magazine.',
};

async function getUserIdFromCookie(): Promise<number | null> {
    const cookie = cookies().get(COOKIE_NAME);
    if (!cookie) return null;
    
    try {
        const { payload } = await jwtVerify(cookie.value, COOKIE_SECRET);
        // We need to parse the inner token to get the user ID
        const strapiJwt = payload.token as string;
        if (!strapiJwt) return null;
        
        // This is a simplified way to get user ID without another verification call
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
        redirect('/login');
    }
    
    const favoriteArticles = await getFavoriteArticles(userId, token);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <SectionTitle>Mis Artículos Guardados</SectionTitle>
            <p className="mt-4 text-center text-lg text-muted-foreground max-w-2xl mx-auto">
                Tu colección personal de inspiración y estilo.
            </p>

            {favoriteArticles.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                    <ArticleList articles={favoriteArticles} />
                </div>
            ) : (
                <div className="mt-16 text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                    <p className="text-lg">Aún no has guardado ningún artículo.</p>
                    <p className="mt-2">Explora nuestras publicaciones y guarda las que más te inspiren.</p>
                </div>
            )}
        </div>
    );
}
