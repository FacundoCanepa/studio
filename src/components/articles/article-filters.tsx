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
    <aside className="w-full lg:w-80 lg:shrink-0 p-6 bg-card rounded-lg border-4 border-black" style={{ boxShadow: '8px 8px 0 #000' }}>
      <h3 className="text-2xl font-headline flex items-center mb-6">
        <ListFilter className="w-6 h-6 mr-3" />
        Filtros
      </h3>

      <div className="space-y-8">
        {/* Search */}
        <div>
          <Label htmlFor="search-query" className="font-code text-sm uppercase tracking-wider">Buscar</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="search-query"
              placeholder="Filtrar artículos..."
              value={filters.query}
              onChange={e => onFilterChange({ query: e.target.value })}
              className="pl-10 retro-input"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category-select" className="font-code text-sm uppercase tracking-wider">Categoría</Label>
          <Select
            value={filters.category}
            onValueChange={value => onFilterChange({ category: value })}
          >
            <SelectTrigger id="category-select" className="mt-2 retro-input">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent className="font-code border-2 border-black retro-input">
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
          <Label htmlFor="author-select" className="font-code text-sm uppercase tracking-wider">Autor</Label>
          <Select
            value={filters.author}
            onValueChange={value => onFilterChange({ author: value })}
          >
            <SelectTrigger id="author-select" className="mt-2 retro-input">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="font-code border-2 border-black retro-input">
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
            <Label className="font-code text-sm uppercase tracking-wider">Etiquetas</Label>
            <div className="mt-3 space-y-3 max-h-40 overflow-y-auto pr-2">
                {allTags.map(tag => (
                    <div key={tag} className="flex items-center">
                        <Checkbox
                            id={`tag-${tag}`}
                            checked={filters.tags.includes(tag)}
                            onCheckedChange={checked => handleTagChange(tag, !!checked)}
                            className="h-5 w-5 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                        />
                        <Label htmlFor={`tag-${tag}`} className="ml-3 font-code text-base">
                            {tag}
                        </Label>
                    </div>
                ))}
            </div>
        </div>

        {/* Featured */}
        <div className="flex items-center justify-between pt-4 border-t border-dashed border-black/50">
          <Label htmlFor="featured-switch" className="font-code text-sm uppercase tracking-wider">Solo Destacados</Label>
          <Switch
            id="featured-switch"
            checked={filters.featured}
            onCheckedChange={checked => onFilterChange({ featured: checked })}
          />
        </div>

        {/* Sort */}
        <div>
            <Label htmlFor="sort-select" className="font-code text-sm uppercase tracking-wider">Ordenar por</Label>
            <Select
                value={filters.sort}
                onValueChange={(value: Filters['sort']) => onFilterChange({ sort: value })}
            >
                <SelectTrigger id="sort-select" className="mt-2 retro-input">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-code border-2 border-black retro-input">
                    <SelectItem value="publishedAt:desc">Más recientes</SelectItem>
                    <SelectItem value="publishedAt:asc">Más antiguos</SelectItem>
                    <SelectItem value="title:asc">Título (A-Z)</SelectItem>
                    <SelectItem value="title:desc">Título (Z-A)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Clear Filters */}
        <Button variant="outline" onClick={onClearFilters} className="w-full retro-input h-auto py-3 text-base">
          <X className="w-5 h-5 mr-2" />
          Limpiar filtros
        </Button>
      </div>
    </aside>
  );
}
