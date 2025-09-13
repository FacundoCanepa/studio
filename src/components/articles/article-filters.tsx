'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, ListFilter, Search } from 'lucide-react';
import type { ArticleDoc, CategoryDoc, AuthorDoc } from '@/lib/firestore-types';

export interface Filters {
  query: string;
  category: string;
  author: string;
  tags: string[];
  featured: boolean;
  sort: 'publishedAt:desc' | 'publishedAt:asc' | 'title:asc' | 'title:desc';
}

interface ArticleFiltersProps {
  articles: ArticleDoc[];
  categories: CategoryDoc[];
  authors: AuthorDoc[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onClearFilters: () => void;
}

export function ArticleFilters({
  articles,
  categories,
  authors,
  filters,
  onFilterChange,
  onClearFilters,
}: ArticleFiltersProps) {
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    articles.forEach(article => {
      article.tags?.forEach(tag => tagsSet.add(tag.name));
    });
    return Array.from(tagsSet).sort();
  }, [articles]);

  const handleTagChange = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...filters.tags, tag]
      : filters.tags.filter(t => t !== tag);
    onFilterChange({ tags: newTags });
  };

  return (
    <aside className="w-full lg:w-80 lg:shrink-0 p-6 bg-card rounded-lg shadow-sm">
      <h3 className="text-xl font-headline flex items-center mb-6">
        <ListFilter className="w-5 h-5 mr-2" />
        Filtros
      </h3>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <Label htmlFor="search-query">Buscar</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-query"
              placeholder="Título o extracto..."
              value={filters.query}
              onChange={e => onFilterChange({ query: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category-select">Categoría</Label>
          <Select
            value={filters.category}
            onValueChange={value => onFilterChange({ category: value })}
          >
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.documentId} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Author */}
        <div>
          <Label htmlFor="author-select">Autor</Label>
          <Select
            value={filters.author}
            onValueChange={value => onFilterChange({ author: value })}
          >
            <SelectTrigger id="author-select">
              <SelectValue placeholder="Todos los autores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los autores</SelectItem>
              {authors.map(author => (
                <SelectItem key={author.documentId} value={author.name}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Tags */}
        <div>
            <Label>Etiquetas</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                {allTags.map(tag => (
                    <div key={tag} className="flex items-center">
                        <Checkbox
                            id={`tag-${tag}`}
                            checked={filters.tags.includes(tag)}
                            onCheckedChange={checked => handleTagChange(tag, !!checked)}
                        />
                        <Label htmlFor={`tag-${tag}`} className="ml-2 font-normal">
                            {tag}
                        </Label>
                    </div>
                ))}
            </div>
        </div>

        {/* Featured */}
        <div className="flex items-center justify-between">
          <Label htmlFor="featured-switch">Solo Destacados</Label>
          <Switch
            id="featured-switch"
            checked={filters.featured}
            onCheckedChange={checked => onFilterChange({ featured: checked })}
          />
        </div>

        {/* Sort */}
        <div>
            <Label htmlFor="sort-select">Ordenar por</Label>
            <Select
                value={filters.sort}
                onValueChange={(value: Filters['sort']) => onFilterChange({ sort: value })}
            >
                <SelectTrigger id="sort-select">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="publishedAt:desc">Más recientes</SelectItem>
                    <SelectItem value="publishedAt:asc">Más antiguos</SelectItem>
                    <SelectItem value="title:asc">Título (A-Z)</SelectItem>
                    <SelectItem value="title:desc">Título (Z-A)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Clear Filters */}
        <Button variant="outline" onClick={onClearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Limpiar filtros
        </Button>
      </div>
    </aside>
  );
}
