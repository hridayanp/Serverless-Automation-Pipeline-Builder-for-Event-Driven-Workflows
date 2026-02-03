'use client';

import { Button } from '@/components/ui/button';
import React from 'react';

interface PanelProps<T> {
  title?: string;
  addButtonLabel?: string;
  onAddClick?: () => void;
  isLoading?: boolean;
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function Panel<T>({
  addButtonLabel = 'Add Item',
  onAddClick,
  isLoading = false,
  data,
  renderItem,
  emptyMessage = 'No data found.',
  className = '',
}: PanelProps<T>) {
  return (
    <div className={`w-[20%] flex-shrink-0 flex flex-col h-full ${className}`}>
      {onAddClick && (
        <Button className="mt-4 p-5 text-[16px] w-[95%]" onClick={onAddClick}>
          {addButtonLabel}
        </Button>
      )}

      {isLoading ? (
        <div className="mt-6">Loading...</div>
      ) : (
        <div className="mt-4 space-y-4 overflow-auto flex-grow h-[calc(100vh-517px)] thin-scrollbar pr-2">
          {data.length > 0 ? (
            data.map((item, index) => renderItem(item, index))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-lg">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
