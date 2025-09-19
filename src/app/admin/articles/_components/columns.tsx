
"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ArticleDoc } from "@/lib/firestore-types";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { deleteArticleAction } from '@/app/actions/articleActions';
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import * as React from 'react';

async function deleteArticle(documentId: string, toast: any) {
    const result = await deleteArticleAction(documentId);
    toast({
        title: result.success ? 'Éxito' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
    });
}

export const columns: ColumnDef<ArticleDoc>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "author.name",
    header: "Autor",
    cell: ({ row }) => {
        const authorName = row.original.author?.name;
        return authorName || 'N/A';
    }
  },
  {
    accessorKey: "category.name",
    header: "Categoría",
    cell: ({ row }) => {
        const categoryName = row.original.category?.name;
        return categoryName ? <Badge variant="secondary">{categoryName}</Badge> : 'N/A'
    }
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Publicado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const publishedAt = row.getValue("publishedAt");
      return publishedAt ? (
        <Badge variant="default">Publicado</Badge>
      ) : (
        <Badge variant="outline">Borrador</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
        const article = row.original;
        const { toast } = useToast();

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/articles/edit/${article.documentId}`}>Editar</Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <a href={`/articulos/${article.slug}`} target="_blank" rel="noopener noreferrer">
                    Ver en sitio
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteConfirm 
                onConfirm={() => deleteArticle(article.documentId, toast)}
                title="¿Estás absolutamente seguro?"
                description="Esta acción no se puede deshacer. Esto eliminará permanentemente el artículo."
              >
                 <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Eliminar
                </DropdownMenuItem>
              </DeleteConfirm>
            </DropdownMenuContent>
          </DropdownMenu>
        )
    }
  },
];
