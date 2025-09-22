'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreVertical, CornerDownRight, Loader2 } from 'lucide-react';
import type { Comment } from '@/hooks/use-comments';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirm } from '@/components/admin/DeleteConfirm';
import { useToast } from '@/hooks/use-toast';

import type { StrapiUser } from '@/lib/strapi-types';

interface CommentItemProps {
  comment: Comment;
  articleId: number;
  currentUser: StrapiUser | null;
  onCommentAdded: (content: string, parentId?: number) => Promise<void>;
  onCommentUpdated: (commentId: number, content: string, parentId?: number) => Promise<void>;
  onCommentDeleted: (commentId: number, parentId?: number) => Promise<void>;
  parentId?: number;
}

export function CommentItem({
  comment,
  articleId,
  currentUser,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  parentId,
}: CommentItemProps) {
  const { toast } = useToast();
  const [isReplying, setIsReplying] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Derivar displayName e inicial en base a tu tipo CommentAuthor (username/name)
  const displayName =
    (comment.author.name && comment.author.name.trim()) || comment.author.username || 'Usuario';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Permisos (si no viene canManage desde la API, permite al autor editar/borrar)
  const canManage =
    (comment as any).canManage ??
    (currentUser ? currentUser.id === comment.author.id : false);
  const canReply = Boolean(currentUser);

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const handleReplySubmit = async (content: string) => {
    try {
      await onCommentAdded(content, comment.id);
      setIsReplying(false);
      toast({ title: 'Respuesta publicada.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleUpdateSubmit = async (content: string) => {
    try {
      await onCommentUpdated(comment.id, content, parentId);
      setIsEditing(false);
      toast({ title: 'Comentario actualizado.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onCommentDeleted(comment.id, parentId);
      toast({ title: 'Comentario eliminado.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-4">
      {/* Avatar circular con inicial */}
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6B8E23] text-white font-semibold uppercase">
          {userInitial}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{displayName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-xs text-muted-foreground">(editado)</span>
            )}
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  Editar
                </DropdownMenuItem>

                <DeleteConfirm
                  onConfirm={handleDelete}
                  title="¿Eliminar comentario?"
                  description="Esta acción es permanente."
                >
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Eliminar
                  </DropdownMenuItem>
                </DeleteConfirm>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <CommentForm
            onSubmit={handleUpdateSubmit}
            initialContent={comment.content}
            submitLabel="Actualizar"
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <p className="mt-1 text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
        )}

        {!isEditing && canReply && (
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)}>
              <CornerDownRight className="mr-2 h-4 w-4" />
              Responder
            </Button>
          </div>
        )}

        {isReplying && (
          <div className="mt-4">
            <CommentForm
              onSubmit={handleReplySubmit}
              submitLabel="Publicar Respuesta"
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}

        {comment.children && comment.children.length > 0 && (
          <div className="mt-6 space-y-6 pl-4 border-l-2">
            {comment.children.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                articleId={articleId}
                currentUser={currentUser}
                onCommentAdded={onCommentAdded}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
                parentId={comment.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
