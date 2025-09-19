
'use client';

import { useState, useEffect, useCallback } from 'react';
import { listAuthors } from '@/lib/strapi-authors';
import { useDebounce } from '@/hooks/use-debounce';
import type { AuthorDoc } from '@/lib/strapi-authors';

interface AuthorsTableState {
  items: AuthorDoc[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  } | null;
}

// Helper to map raw Strapi data to AuthorDoc
function mapToAuthorDocs(data: any[]): AuthorDoc[] {
    return data.map(item => {
        const attrs = item.attributes;
        if (!attrs) return null; // Add a guard clause
        return {
            documentId: attrs.documentId,
            name: attrs.name,
            slug: attrs.slug,
            bio: attrs.bio,
            role: attrs.role,
            avatarUrl: attrs.avatarUrl,
            instagram: attrs.instagram,
            tiktok: attrs.tiktok,
            youtube: attrs.youtube,
            website: attrs.website,
            isActive: attrs.isActive,
            featured: attrs.featured,
            createdAt: attrs.createdAt,
            updatedAt: attrs.updatedAt,
        };
    }).filter((item): item is AuthorDoc => item !== null); // Filter out null items
}

interface UseAuthorsTableProps {
  initialPage?: number;
  pageSize?: number;
  initialSearch?: string;
}

export function useAuthorsTable({ 
  initialPage = 1, 
  pageSize = 10, 
  initialSearch = '' 
}: UseAuthorsTableProps) {
  const [data, setData] = useState<AuthorsTableState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  
  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listAuthors({
        page,
        pageSize,
        search: debouncedSearch,
      });
      setData({ items: mapToAuthorDocs(response.data), meta: response.meta });
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar los autores.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    // Cuando la búsqueda cambia, volvemos a la página 1
    if (debouncedSearch !== initialSearch) {
      setPage(1);
    }
  }, [debouncedSearch, initialSearch]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.meta?.pagination?.pageCount || 1)) {
        setPage(newPage);
    }
  };

  return {
    data,
    isLoading,
    error,
    page,
    pageSize,
    search,
    pageCount: data?.meta?.pagination?.pageCount || 1,
    handleSearchChange,
    handlePageChange,
  };
}
