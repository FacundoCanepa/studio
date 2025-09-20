"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { GalleryItemDoc } from "@/lib/firestore-types";
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
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import * as React from 'react';
import { deleteGalleryItemAction } from "@/app/actions/galleryActions";
import Image from "next/image";

async function deleteItem(documentId: string, toast: any) {
    const result = await deleteGalleryItemAction(documentId);
    toast({
        title: result.success ? 'Éxito' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
    });
}

export const columns: ColumnDef<GalleryItemDoc>[] = [
  {
    accessorKey: "imageUrl",
    header: "Imagen",
    cell: ({ row }) => {
      const imageUrl = row.getValue("imageUrl") as string;
      return imageUrl ? (
        <Image
          src={imageUrl}
          alt={row.original.title}
          width={80}
          height={80}
          className="object-cover rounded-md aspect-square"
          sizes="80px"
        />
      ) : (
        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Famoso
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "description",
    header: "Nota",
    cell: ({ row }) => <div className="line-clamp-2">{row.getValue("description")}</div>,
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
        const item = row.original;
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
                <Link href={`/admin/galeria/edit/${item.id}`}>Editar</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteConfirm 
                onConfirm={() => deleteItem(item.id, toast)}
                title="¿Estás absolutamente seguro?"
                description="Esta acción no se puede deshacer. Esto eliminará permanentemente el elemento de la galería."
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
