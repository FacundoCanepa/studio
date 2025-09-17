
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

async function deleteArticle(id: string, toast: any) {
    const result = await deleteArticleAction(id);
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
        console.log(`[COLUMNS_DEBUG] Row ID ${row.original.documentId} - Author object:`, JSON.stringify(row.original.author, null, 2));
        return authorName || 'N/A';
    }
  },
  {
    accessorKey: "category.name",
    header: "Categoría",
    cell: ({ row }) => {
        const categoryName = row.original.category?.name;
        console.log(`[COLUMNS_DEBUG] Row ID ${row.original.documentId} - Category object:`, JSON.stringify(row.original.category, null, 2));
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
            <AlertDialog>
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
                    <Link href={`/admin/articles/edit/${article.id}`}>Editar</Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <a href={`/articulos/${article.slug}`} target="_blank" rel="noopener noreferrer">
                        Ver en sitio
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                     <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Eliminar
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el artículo
                          de tus servidores.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteArticle(article.documentId, toast)} className="bg-destructive hover:bg-destructive/90">
                          Sí, eliminar artículo
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        )
    }
  },
];
