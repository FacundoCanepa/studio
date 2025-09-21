'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '@/context/auth-context';
import type { StrapiResponse, StrapiUser } from '@/lib/strapi-types';

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

async function parseJsonResponse<T>(response: Response, context: string): Promise<ParsedJsonResponse<T>> {
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
            // Ignored: we already logged the parsing issue above.
        }
    }

    return { body: (body ?? null), rawText };
}

function resolveErrorMessage(body: unknown, rawText: string | undefined, fallback: string) {
    if (body && typeof body === 'object') {
        const payload = body as Record<string, unknown>;
        const errorField = payload.error;

        if (typeof errorField === 'string' && errorField.trim().length > 0) {
            return errorField;
        }

        if (errorField && typeof errorField === 'object' && 'message' in errorField) {
            const nestedMessage = (errorField as Record<string, unknown>).message;
            if (typeof nestedMessage === 'string' && nestedMessage.trim().length > 0) {
                return nestedMessage;
            }
        }

        const message = payload.message;
        if (typeof message === 'string' && message.trim().length > 0) {
            return message;
        }
    }

    if (typeof body === 'string' && body.trim().length > 0) {
        return body;
    }

    if (rawText && rawText.trim().length > 0) {
        return rawText;
    }

    return fallback;
}

function extractDataField<T>(payload: unknown): T | null {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        const data = (payload as { data: T }).data;
        return data ?? null;
    }

    return null;
}

async function fetchComments(
    documentId: string,
    page: number,
    pageSize: number
): Promise<CommentsApiResponse> {
    const res = await fetch(
        `/api/strapi/articles/document/${documentId}/comments?page=${page}&pageSize=${pageSize}`
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
    const { body, rawText } = await parseJsonResponse<{ data: Comment }>(res, 'COMMENTS_CREATE');
    if (!res.ok) {
        throw new Error(resolveErrorMessage(body, rawText, 'No se pudo publicar el comentario.'))
    }
    const data = extractDataField<Comment>(body);
    if (!data) {
        throw new Error('La respuesta al publicar el comentario es inválida.');
    }

    return data;
}

async function updateComment(token: string, commentId: number, content: string): Promise<Comment> {
    const res = await fetch(`/api/strapi/comments/${commentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { content } }),
    });
    const { body, rawText } = await parseJsonResponse<{ data: Comment }>(res, 'COMMENTS_UPDATE');

    if (!res.ok) {
        throw new Error(resolveErrorMessage(body, rawText, 'No se pudo actualizar el comentario.'));
    }

    const data = extractDataField<Comment>(body);
    if (!data) {
        throw new Error('La respuesta al actualizar el comentario es inválida.');
    }

    return data;
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

    const pageSize = 10;

    const loadComments = useCallback(async (pageNum: number) => {
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
    }, [documentId]);

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

        const newCommentWithAuthor: Comment = {
            ...newCommentData,
            author: {
                id: user!.id,
                username: user!.username,
                name: user!.username,
                avatar: undefined,
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
    
    const handleUpdateComment = async (commentId: number, content: string, parentId?: number) => {
        if (!token) throw new Error('Debes iniciar sesión para editar.');

        const updatedCommentData = await updateComment(token, commentId, content);

        const updateState = (commentsList: Comment[]): Comment[] => {
            return commentsList.map(c => {
                if (c.id === commentId) {
                    return { ...c, content: updatedCommentData.content, updatedAt: updatedCommentData.updatedAt };
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
            return commentsList.filter(c => c.id !== commentId).map(c => {
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
