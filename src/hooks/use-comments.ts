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

async function fetchComments(
    documentId: string,
    page: number,
    pageSize: number
): Promise<CommentsApiResponse> {
    const res = await fetch(
        `/api/strapi/articles/document/${documentId}/comments?page=${page}&pageSize=${pageSize}`
    );
    if (!res.ok) {
        throw new Error('No se pudieron cargar los comentarios.');
    }
    return res.json();
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
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'No se pudo publicar el comentario.');
    }
    const result = await res.json();
    return result.data;
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

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'No se pudo actualizar el comentario.');
    }
    const result = await res.json();
    return result.data;
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
            setTotal(prev => prev -1);
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
