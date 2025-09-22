'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '@/context/auth-context';
import type { CommentDto, CommentsPagination } from '@/lib/strapi-comments';

const DEFAULT_PAGE_SIZE = 10;

type CommentsListSuccess = {
  ok: true;
  data: CommentDto[];
  meta?: { pagination?: CommentsPagination };
};

type CommentSuccess = { ok: true; data: CommentDto };

type CommentsError = {
  ok: false;
  error?: { message?: string; details?: unknown; code?: string } | null;
};

export interface Comment extends Omit<CommentDto, 'children'> {
  children: Comment[];
  canManage: boolean;
}

function extractErrorMessage(payload: CommentsError | undefined | null, fallback: string): string {
  if (!payload) return fallback;
  const message = payload.error?.message?.trim() || fallback;
  const details = Array.isArray(payload.error?.details) ? payload.error.details.join(' ') : null;
  return details ? `${message} ${details}`.trim() : message;
}

function mapCommentDto(dto: CommentDto, currentUserId: number | null): Comment {
  const authorId = dto.author?.id ?? null;
  const canManage = currentUserId !== null && authorId !== null && authorId === currentUserId;

  const mappedChildren = Array.isArray(dto.children)
    ? dto.children.map((child) => mapCommentDto(child, currentUserId))
    : [];

  return { ...dto, children: mappedChildren, canManage };
}

function mapCommentList(dtos: CommentDto[], currentUserId: number | null): Comment[] {
  return dtos.map((dto) => mapCommentDto(dto, currentUserId));
}

function updateOwnershipFlags(list: Comment[], currentUserId: number | null): Comment[] {
  return list.map((comment) => {
    const canManage = currentUserId !== null && comment.author?.id !== null && comment.author?.id === currentUserId;
    const updatedChildren = comment.children.length > 0 ? updateOwnershipFlags(comment.children, currentUserId) : comment.children;
    if (canManage !== comment.canManage || updatedChildren !== comment.children) {
      return { ...comment, canManage, children: updatedChildren };
    }
    return comment;
  });
}

function mergeRefreshedComments(existing: Comment[], refreshed: Comment[]): Comment[] {
  const refreshedIds = new Set(refreshed.map((comment) => comment.id));
  const extras = existing.filter((comment) => !refreshedIds.has(comment.id));
  return [...refreshed, ...extras];
}

function appendComments(existing: Comment[], incoming: Comment[]): Comment[] {
  if (incoming.length === 0) return existing;
  const existingIds = new Set(existing.map(c => c.id));
  const newComments = incoming.filter(c => !existingIds.has(c.id));
  return [...existing, ...newComments];
}

function insertComment(list: Comment[], comment: Comment): Comment[] {
  if (comment.parentId) {
    let updated = false;
    const next = list.map((item) => {
      if (item.id === comment.parentId) {
        updated = true;
        return { ...item, children: [...item.children, comment] };
      }
      if (item.children.length > 0) {
        const children = insertComment(item.children, comment);
        if (children !== item.children) {
          updated = true;
          return { ...item, children };
        }
      }
      return item;
    });
    return updated ? next : list;
  }
  return [comment, ...list];
}

function replaceComment(list: Comment[], updated: Comment): Comment[] {
  return list.map(item => {
    if (item.id === updated.id) return { ...updated };
    if (item.children.length > 0) {
      const children = replaceComment(item.children, updated);
      if (children !== item.children) return { ...item, children };
    }
    return item;
  });
}

function removeCommentById(list: Comment[], commentId: number): Comment[] {
  return list.reduce((acc, item) => {
    if (item.id === commentId) return acc;
    if (item.children.length > 0) {
      item.children = removeCommentById(item.children, commentId);
    }
    acc.push(item);
    return acc;
  }, [] as Comment[]);
}


interface FetchCommentsResult {
  comments: CommentDto[];
  pagination: CommentsPagination;
}

async function fetchComments(
  articleId: number,
  pageNum: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<FetchCommentsResult> {
  const params = new URLSearchParams({ page: String(pageNum), pageSize: String(pageSize) });
  const url = `/api/articles/${articleId}/comments?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', cache: 'no-store', signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('No se pudieron cargar los comentarios.');
  }
  
  // Use a different name for the parsed body to avoid shadowing
  const apiPayload: CommentsListSuccess | CommentsError | any = await response.json();

  if (!response.ok || !apiPayload || apiPayload.ok === false) {
    // If the payload has a nested structure from the proxy, dig for the error.
    const errorSource = apiPayload.details ?? apiPayload;
    throw new Error(extractErrorMessage(errorSource, 'No se pudieron cargar los comentarios.'));
  }

  const commentData = Array.isArray(apiPayload.data) ? apiPayload.data : [];
  const fallbackTotal = commentData.length;
  const pagination = apiPayload.meta?.pagination ?? {
    page: pageNum,
    pageSize,
    pageCount: Math.max(1, Math.ceil(fallbackTotal / Math.max(pageSize, 1))),
    total: fallbackTotal,
  };

  return { comments: commentData, pagination };
}


async function postComment(
  payload: { content: string; articleId: number; articleDocumentId: string; parentId?: number },
): Promise<CommentDto> {
  let response: Response;
  try {
    response = await fetch('/api/comments', {
      method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) { throw new Error('No se pudo publicar el comentario.'); }
  
  const body: CommentSuccess | CommentsError = await response.json();
  if (!response.ok || !body.ok) throw new Error(extractErrorMessage(body as CommentsError, 'No se pudo publicar el comentario.'));
  return body.data;
}

async function putComment(
  commentId: number,
  payload: { content: string; articleDocumentId: string },
): Promise<CommentDto> {
  let response: Response;
  try {
    response = await fetch(`/api/comments/${commentId}`, {
      method: 'PUT', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) { throw new Error('No se pudo actualizar el comentario.'); }

  const body: CommentSuccess | CommentsError = await response.json();
  if (!response.ok || !body.ok) throw new Error(extractErrorMessage(body as CommentsError, 'No se pudo actualizar el comentario.'));
  return body.data;
}

async function removeComment(
  commentId: number,
  payload: { articleDocumentId: string },
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) { throw new Error('No se pudo eliminar el comentario.'); }

  if (response.status === 204) return;
  const body: { ok: boolean } | CommentsError | undefined = await response.json();
  if (!response.ok || !body || (body as CommentsError).ok === false) {
    throw new Error(extractErrorMessage(body as CommentsError, 'No se pudo eliminar el comentario.'));
  }
}

type LoadMode = 'initial' | 'append' | 'refresh';

export function useComments(articleId: number, documentId: string) {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const currentUserIdRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    currentUserIdRef.current = typeof user?.id === 'number' ? user.id : null;
    setComments((prev) => updateOwnershipFlags(prev, currentUserIdRef.current));
  }, [user?.id]);

  const setLoadingState = useCallback((mode: LoadMode, value: boolean) => {
    if (mode === 'initial') setIsInitialLoading(value);
    else if (mode === 'append') setIsLoadingMore(value);
    else setIsRefreshing(value);
  }, []);

  const loadComments = useCallback(
    async (pageToLoad: number, mode: LoadMode = 'initial') => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoadingState(mode, true);
      setError(null);
      try {
        const { comments: dtos, pagination } = await fetchComments(articleId, pageToLoad, pageSizeRef.current, controller.signal);
        const mapped = mapCommentList(dtos, currentUserIdRef.current);
        setComments((prev) => mode === 'append' ? appendComments(prev, mapped) : mode === 'refresh' ? mergeRefreshedComments(prev, mapped) : mapped);
        setPage(pagination.page);
        setPageCount(pagination.pageCount);
        setTotal(pagination.total);
        pageSizeRef.current = pagination.pageSize;
      } catch (error) {
        if ((error instanceof DOMException && error.name === 'AbortError') || controller.signal.aborted) return;
        console.error('[USE_COMMENTS_DEBUG] Error fetching comments:', error);
        setError((error as Error)?.message ?? 'No se pudieron cargar los comentarios.');
      } finally {
        if (controllerRef.current === controller) {
          setLoadingState(mode, false);
          controllerRef.current = null;
        }
      }
    },
    [articleId, setLoadingState],
  );

  useEffect(() => {
    pageSizeRef.current = DEFAULT_PAGE_SIZE;
    setComments([]);
    setPage(1); setPageCount(1); setTotal(0); setError(null); setIsInitialLoading(true);
    loadComments(1, 'initial').catch((err) => console.error(err));
    return () => { controllerRef.current?.abort(); };
  }, [documentId, loadComments]);

  const refreshComments = useCallback(() => loadComments(1, 'refresh'), [loadComments]);
  const loadMore = useCallback(() => {
    if (isInitialLoading || isLoadingMore || isRefreshing || page >= pageCount) return;
    loadComments(page + 1, 'append');
  }, [isInitialLoading, isLoadingMore, isRefreshing, page, pageCount, loadComments]);

  const handleAddComment = useCallback(async (content: string, parentId?: number) => {
    if (!user) throw new Error('Debes iniciar sesión para comentar.');
    const dto = await postComment({ content, articleId, articleDocumentId: documentId, parentId });
    const mapped = mapCommentDto(dto, currentUserIdRef.current);
    setComments((prev) => insertComment(prev, mapped));
    if (!parentId) setTotal((prev) => prev + 1);
    await refreshComments();
  }, [user, articleId, documentId, refreshComments]);

  const handleUpdateComment = useCallback(async (commentId: number, content: string) => {
    if (!user) throw new Error('Debes iniciar sesión para editar.');
    const dto = await putComment(commentId, { content, articleDocumentId: documentId });
    const mapped = mapCommentDto(dto, currentUserIdRef.current);
    setComments((prev) => replaceComment(prev, mapped));
    await refreshComments();
  }, [user, documentId, refreshComments]);

  const handleDeleteComment = useCallback(async (commentId: number, parentId?: number) => {
    if (!user) throw new Error('Debes iniciar sesión para eliminar.');
    await removeComment(commentId, { articleDocumentId: documentId });
    setComments((prev) => removeCommentById(prev, commentId));
    if (!parentId) setTotal((prev) => Math.max(prev - 1, 0));
    await refreshComments();
  }, [user, documentId, refreshComments]);

  return {
    comments, user, loading: isInitialLoading, loadingMore: isLoadingMore,
    refreshing: isRefreshing, error, page, pageCount, total,
    loadMore, addComment: handleAddComment, updateComment: handleUpdateComment,
    deleteComment: handleDeleteComment, refresh: refreshComments,
  };
}
