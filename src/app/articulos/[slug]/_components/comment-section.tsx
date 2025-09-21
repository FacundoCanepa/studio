'use client';

import * as React from 'react';
import { useComments } from '@/hooks/use-comments';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface CommentSectionProps {
  articleId: number;
  documentId: string;
}

export function CommentSection({ articleId, documentId }: CommentSectionProps) {
  const {
    comments,
    user,
    loading,
    error,
    page,
    pageCount,
    total,
    loadMore,
    addComment,
    updateComment,
    deleteComment,
  } = useComments(articleId, documentId);

  const hasMore = page < pageCount;

  const renderContent = () => {
    if (loading && comments.length === 0) {
      return (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (error) {
        return <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    }

    if (comments.length === 0) {
      return (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Sé el primero en comentar</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu opinión es importante. ¡Inicia la conversación!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            articleId={articleId}
            currentUser={user}
            onCommentAdded={addComment}
            onCommentUpdated={updateComment}
            onCommentDeleted={deleteComment}
          />
        ))}
        {hasMore && (
          <div className="text-center">
            <Button onClick={loadMore} disabled={loading} variant="outline">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cargar más comentarios
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="comments" className="space-y-12">
      <div>
        <h2 className="text-3xl font-headline mb-2">{total} Comentarios</h2>
        <p className="text-muted-foreground">
          Nos encantaría saber qué piensas.
        </p>
      </div>

      {user ? (
        <CommentForm onSubmit={async (content) => addComment(content)} />
      ) : (
        <Alert>
          <AlertTitle>¡Únete a la conversación!</AlertTitle>
          <AlertDescription>
            <Button asChild variant="link" className="p-0 h-auto">
              <a href="/login">Inicia sesión</a>
            </Button>{' '}
            o{' '}
            <Button asChild variant="link" className="p-0 h-auto">
              <a href="/register">créate una cuenta</a>
            </Button>{' '}
            para dejar un comentario.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-12">
        {renderContent()}
      </div>
    </section>
  );
}
