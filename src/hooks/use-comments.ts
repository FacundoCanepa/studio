'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '@/context/auth-context';

export interface CommentAuthor {
    id: number;
    username: string;
    name?: string;
    avatar?: { url?: string };
}

export interface Comment {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    estado?: string;
    author: CommentAuthor;
    children: Comment[];
}

interface CommentsApiResponse {
    data: Comment[];
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

interface ParsedJsonResponse<T> {
    body: T | null;
    rawText?: string;
}

function parseNumericId(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return 0;
}

function extractRelationAttributes(
    relation: unknown
): (Record<string, any> & { id?: number | string }) | null {
    if (!relation || typeof relation !== 'object') {
        return null;
    }

    if ('data' in relation) {
        const data = (relation as { data?: any }).data;
        if (!data || typeof data !== 'object') {
            return null;
        }
        const attributes = (data as any).attributes ?? {};
        return { id: (data as any).id, ...attributes };
    }

    return relation as Record<string, any>;
}

function normalizeAuthor(relation: unknown): CommentAuthor {
    const relationData = extractRelationAttributes(relation);
    const defaultAuthor: CommentAuthor = { id: 0, username: 'Usuario' };

    if (!relationData) {
        return defaultAuthor;
    }

    const usernameSource =
        relationData.username ?? relationData.email ?? relationData.name;
    const username =
        typeof usernameSource === 'string' && usernameSource.trim().length > 0
            ? usernameSource.trim()
            : 'Usuario';

    const author: CommentAuthor = {
        id: parseNumericId(relationData.id),
        username,
    };

    if (typeof relationData.name === 'string' && relationData.name.trim().length > 0) {
        author.name = relationData.name.trim();
    }

    const avatarRelation = relationData.avatar;
    const avatarUrl =
        avatarRelation?.data?.attributes?.url ?? avatarRelation?.url ?? undefined;

    if (avatarUrl) {
        author.avatar = { url: avatarUrl };
    }

    return author;
}

function normalizeCommentEntity(entity: unknown): Comment {
    if (!entity || typeof entity !== 'object') {
        throw new Error('Strapi devolvió un comentario inválido.');
    }

    if ('content' in entity && 'author' in entity && Array.isArray((entity as any).children)) {
        return entity as Comment;
    }

    const base = 'data' in entity && (entity as any).data ? (entity as any).data : entity;
    const attributes = (base as any).attributes ?? base;
    const childrenSource =
        attributes?.children?.data ??
        (Array.isArray(attributes?.children) ? attributes.children : []);

    const comment: Comment = {
        id: parseNumericId((base as any)?.id ?? attributes?.id),
        content: attributes?.content ?? attributes?.body ?? '',
        createdAt: attributes?.createdAt ?? new Date().toISOString(),
        updatedAt: attributes?.updatedAt ?? attributes?.createdAt ?? new Date().toISOString(),
        estado: attributes?.estado ?? (base as any)?.estado ?? undefined,
        author: normalizeAuthor(
            attributes?.author ??
                attributes?.users_permissions_user ??
                (base as any)?.author ??
                (base as any)?.users_permissions_user
        ),
        children: Array.isArray(childrenSource)
            ? childrenSource.map((child: unknown) => normalizeCommentEntity(child))
            : [],
    };

    return comment;
}

async function parseJsonResponse<T>(
    response: Response,
    context: string
): Promise<ParsedJsonResponse<T>> {
    if (response.status === 204 || response.status === 205) {
        return { body: null };
    }

    let body: T | undefined;
    let rawText: string | undefined;
    const clonedResponse = response.clone();

    try {
        body = (await response.json()) as T;
    } catch (error) {
        rawText = await clonedResponse.text().catch(() => undefined);
        console.error(`[${context}_PARSE_ERROR]`, {
            message: (error as Error)?.message,
            rawBody: rawText,
        });
    }

    if (body === undefined && rawText && rawText.trim().length > 0) {
        try {
            body = JSON.parse(rawText) as T;
        } catch {
            // Ignorado
        }
    }

    return { body: body ?? null, rawText };
}

// Helpers faltantes
function resolveErrorMessage(body: any, rawText: string | undefined, fallback: string): string {
    return (
        body?.error?.message ||
        body?.message ||
        rawText ||
        fallback
    );
}

function extractDataField<T>(body: any): T | null {
    if (!body) return null;
    if ('data' in body) return body.data as T;
    return body as T;
}

async function fetchComments(
    documentId: string,
    pageNum: number,
    pageSize: number
): Promise<CommentsApiResponse> {
    const res = await fetch(
        `/api/strapi/comments?filters[article][documentId][$eq]=${documentId}&pagination[page]=${pageNum}&pagination[pageSize]=${pageSize}`
    );
    const { body, rawText } = await parseJsonResponse<CommentsApiResponse>(res, 'COMMENTS_FETCH');
    if (!res.ok) {
        throw new Error(resolveErrorMessage(body, rawText, 'No se pudieron cargar los comentarios.'));
    }

    if (!body || !Array.isArray(body.data)) {
        throw new Error('La respuesta de comentarios es inválida.');
    }

    return body;
}

async function postComment(
    token: string,
    payload: { content: string; article: number; parent?: number }
): Promise<Comment> {
    const res = await fetch(`/api/strapi/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: payload }),
    });
    const { body, rawText } = await parseJsonResponse<{ data: unknown }>(res, 'COMMENTS_CREATE');
    if (!res.ok) {
        throw new Error(resolveErrorMessage(body, rawText, 'No se pudo publicar el comentario.'));
    }
    const data = extractDataField<unknown>(body);
    if (!data) {
        throw new Error('La respuesta al publicar el comentario es inválida.');
    }

    return normalizeCommentEntity(data);
}

async function updateComment(
    token: string,
    commentId: number,
    content: string
): Promise<Comment> {
    const res = await fetch(`/api/strapi/comments/${commentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { content } }),
    });
    const { body, rawText } = await parseJsonResponse<{ data: unknown }>(res, 'COMMENTS_UPDATE');

    if (!res.ok) {
        throw new Error(resolveErrorMessage(body, rawText, 'No se pudo actualizar el comentario.'));
    }

    const data = extractDataField<unknown>(body);
    if (!data) {
        throw new Error('La respuesta al actualizar el comentario es inválida.');
    }

    return normalizeCommentEntity(data);
}

async function deleteComment(token: string, commentId: number): Promise<void> {
    const res = await fetch(`/api/strapi/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'No se pudo eliminar el comentario.');
    }
}

export function useComments(articleId: number, documentId: string) {
    const { user, token } = useContext(AuthContext);
    const [comments, setComments] = useState<Comment[]>([]);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadComments = useCallback(
        async (pageNum: number, pageSize = 10) => {
            setLoading(true);
            setError(null);
            try {
                const { data, meta } = await fetchComments(documentId, pageNum, pageSize);
                setComments(prev => (pageNum === 1 ? data : [...prev, ...data]));
                setPage(meta.pagination.page);
                setPageCount(meta.pagination.pageCount);
                setTotal(meta.pagination.total);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        },
        [documentId]
    );

    useEffect(() => {
        loadComments(1);
    }, [loadComments]);

    const handleAddComment = async (content: string, parentId?: number): Promise<void> => {
        if (!token) throw new Error('Debes iniciar sesión para comentar.');

        const newCommentData = await postComment(token, {
            content,
            article: articleId,
            parent: parentId,
        });

        const currentUserAvatar =
            (user as any)?.avatar?.data?.attributes?.url || (user as any)?.avatar?.url;
        const authorNameSource = (user as any)?.name ?? user!.username;
        const newCommentWithAuthor: Comment = {
            ...newCommentData,
            author: {
                id: user!.id,
                username: user!.username,
                name:
                    typeof authorNameSource === 'string' && authorNameSource.trim().length > 0
                        ? authorNameSource.trim()
                        : user!.username,
                ...(currentUserAvatar ? { avatar: { url: currentUserAvatar } } : {}),
            },
            children: [],
        };

        if (parentId) {
            setComments(prev =>
                prev.map(c => {
                    if (c.id === parentId) {
                        return { ...c, children: [...c.children, newCommentWithAuthor] };
                    }
                    return c;
                })
            );
        } else {
            setComments(prev => [newCommentWithAuthor, ...prev]);
            setTotal(prev => prev + 1);
        }
    };

    const handleUpdateComment = async (commentId: number, content: string) => {
        if (!token) throw new Error('Debes iniciar sesión para editar.');

        const updatedCommentData = await updateComment(token, commentId, content);

        const updateState = (commentsList: Comment[]): Comment[] => {
            return commentsList.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        content: updatedCommentData.content,
                        updatedAt: updatedCommentData.updatedAt,
                    };
                }
                if (c.children && c.children.length > 0) {
                    return { ...c, children: updateState(c.children) };
                }
                return c;
            });
        };

        setComments(updateState);
    };

    const handleDeleteComment = async (commentId: number, parentId?: number) => {
        if (!token) throw new Error('Debes iniciar sesión para eliminar.');

        await deleteComment(token, commentId);

        const filterState = (commentsList: Comment[]): Comment[] => {
            return commentsList
                .filter(c => c.id !== commentId)
                .map(c => {
                    if (c.children && c.children.length > 0) {
                        return { ...c, children: filterState(c.children) };
                    }
                    return c;
                });
        };

        setComments(filterState);
        if (!parentId) {
            setTotal(prev => prev - 1);
        }
    };

    return {
        comments,
        user,
        loading,
        error,
        page,
        pageCount,
        total,
        loadMore: () => loadComments(page + 1),
        addComment: handleAddComment,
        updateComment: handleUpdateComment,
        deleteComment: handleDeleteComment,
    };
}
