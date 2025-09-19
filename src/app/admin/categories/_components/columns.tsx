
"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { CategoryDoc } from "@/lib/firestore-types";
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
import { deleteCategoryAction } from "@/app/actions/categoryActions";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";

async function deleteCategory(documentId: string, toast: any) {
    const result = await deleteCategoryAction(documentId);
    toast({
        title: result.success ? 'Éxito' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
    });
}

export const columns: ColumnDef<CategoryDoc>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
        const category = row.original;
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
                  <Link href={`/admin/categories/edit/${category.documentId}`}>Editar</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteConfirm 
                    onConfirm={() => deleteCategory(category.documentId, toast)}
                    title="¿Estás absolutamente seguro?"
                    description="Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría."
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
