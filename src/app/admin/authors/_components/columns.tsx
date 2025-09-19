
"use client";

import type { ElementType } from "react";
import { ColumnDef } from "@tanstack/react-table";
import type { AuthorDoc } from "@/lib/strapi-authors";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, MoreHorizontal, Globe, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { deleteAuthorAction } from "@/app/actions/authorActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";

async function deleteAuthor(documentId: string, toast: any) {
    console.log(`[ADMIN_AUTHORS] Deleting author with documentId: ${documentId}`);
    try {
        const result = await deleteAuthorAction(documentId);
        toast({
            title: result.success ? 'Éxito' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
    } catch (error: any) {
        console.error(`[ADMIN_AUTHORS][DELETE_ERROR]`, error);
        toast({
            title: 'Error Inesperado',
            description: 'No se pudo eliminar el autor.',
            variant: 'destructive',
        });
    }
}

export const columns: ColumnDef<AuthorDoc>[] = [
  {
    accessorKey: "avatarUrl",
    header: "",
    cell: ({ row }) => {
      const author = row.original;
      const authorName = author.name || '';
      return (
        <Avatar className="h-9 w-9">
          <AvatarImage src={author.avatarUrl} alt={authorName} />
          <AvatarFallback>{authorName ? authorName.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
        </Avatar>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nombre <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            Actualizado <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
        const date = row.getValue("updatedAt") as string;
        if (!date) return 'N/A';
        return <span>{format(new Date(date), "dd MMM, yyyy", { locale: es })}</span>;
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
        const author = row.original;
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
                  <Link href={`/admin/authors/edit/${author.documentId}`}>Editar</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteConfirm 
                    onConfirm={() => deleteAuthor(author.documentId, toast)}
                    title="¿Estás absolutamente seguro?"
                    description="Esta acción no se puede deshacer. Esto eliminará permanentemente el autor."
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
