
"use client";

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface InputWithBadgesProps {
  name: string;
  defaultValue?: string[];
}

export const InputWithBadges = ({ name, defaultValue = [] }: InputWithBadgesProps) => {
  const [tags, setTags] = React.useState<string[]>(defaultValue);
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'Enter' || event.key === ',') && inputValue.trim()) {
      event.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      {/* Hidden inputs to submit data with the form */}
      {tags.map((tag, index) => (
        <input key={index} type="hidden" name={name} value={tag} />
      ))}
      
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary">
            {tag}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        type="text"
        placeholder="Añade etiquetas..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <p className="text-xs text-muted-foreground mt-1">
        Presiona Enter o Coma para añadir una etiqueta.
      </p>
    </div>
  );
};
