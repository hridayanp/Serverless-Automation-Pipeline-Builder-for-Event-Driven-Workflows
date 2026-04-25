import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

interface ViewSwitcherProps {
  viewMode: 'card' | 'table';
  onViewChange: (mode: 'card' | 'table') => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onViewChange }) => {
  return (
    <div className="bg-white border border-border p-1 rounded-xl flex items-center shadow-sm">
      <Button 
        variant="ghost"
        size="sm" 
        className={`rounded-lg h-8 px-4 font-bold text-[10px] uppercase tracking-wider transition-all border-none ${
          viewMode === 'card' 
            ? 'bg-primary text-white shadow-md hover:bg-primary/90 hover:text-white' 
            : 'text-primary hover:bg-primary/5 hover:text-primary'
        }`}
        onClick={() => onViewChange('card')}
      >
        <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Grid
      </Button>
      <Button 
        variant="ghost"
        size="sm" 
        className={`rounded-lg h-8 px-4 font-bold text-[10px] uppercase tracking-wider transition-all border-none ${
          viewMode === 'table' 
            ? 'bg-primary text-white shadow-md hover:bg-primary/90 hover:text-white' 
            : 'text-primary hover:bg-primary/5 hover:text-primary'
        }`}
        onClick={() => onViewChange('table')}
      >
        <List className="w-3.5 h-3.5 mr-1.5" /> Table
      </Button>
    </div>
  );
};
