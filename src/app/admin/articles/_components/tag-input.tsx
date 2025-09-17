
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  name: string;
  defaultValue?: string[];
  allTags?: string[];
}

export function TagInput({ name, defaultValue = [], allTags = [] }: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(defaultValue);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setInputValue('');
  };

  const handleRemove = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      handleSelect(newTag);
    }
  }

  const filteredTags = allTags.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  const canCreateNew = inputValue && !allTags.includes(inputValue) && !selectedTags.includes(inputValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Hidden inputs for form submission */}
      {selectedTags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
              <button
                type="button"
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => handleRemove(tag)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            Añadir etiquetas...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar o crear etiqueta..." 
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
                {canCreateNew ? 'Presiona Enter para crear.' : 'No se encontraron etiquetas.'}
            </CommandEmpty>
            <CommandGroup>
              {canCreateNew && (
                <CommandItem
                  onSelect={() => handleSelect(inputValue)}
                  className="flex items-center"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear &quot;{inputValue}&quot;
                </CommandItem>
              )}
              {filteredTags.map((tag) => (
                <CommandItem
                  key={tag}
                  value={tag}
                  onSelect={() => {
                    handleSelect(tag);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {tag}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
