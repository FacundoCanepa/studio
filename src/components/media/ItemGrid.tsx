'use client';

import * as React from 'react';

export type ItemType = {
  id: number;
  [key: string]: any;
};

interface ItemGridProps<T extends ItemType> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  itemComponent: React.FC<{ item: T; onRemove: (id: number) => void; }>;
  onRemove: (id: number) => void;
}

export function ItemGrid<T extends ItemType>({
  items,
  setItems,
  itemComponent: ItemComponent,
  onRemove
}: ItemGridProps<T>) {
  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newItems = [...items];
      const draggedItemContent = newItems.splice(dragItem.current, 1)[0];
      newItems.splice(dragOverItem.current, 0, draggedItemContent);
      setItems(newItems);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()} // Necessary for drop to work
          className="cursor-move"
        >
          <ItemComponent item={item} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
