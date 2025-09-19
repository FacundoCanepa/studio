
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
}

export function AuthorDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  const page = searchParams.get('page') ?? "1";
  const query = searchParams.get('query') ?? "";
  
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  const debouncedValue = useDebounce(debouncedQuery, 500);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedValue) {
      params.set('query', debouncedValue);
      params.set('page', '1');
    } else {
      params.delete('query');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedValue, pathname, router, searchParams]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    state: {
      sorting,
    },
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar por nombre o slug..."
          value={debouncedQuery}
          onChange={(event) => setDebouncedQuery(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Number(page) - 1)}
          disabled={Number(page) <= 1}
        >
          Anterior
        </Button>
        <span className="text-sm">
          Página {page} de {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Number(page) + 1)}
          disabled={Number(page) >= pageCount}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
