import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ViewSwitcherProps {
  viewMode: 'card' | 'table';
  onViewChange: (mode: 'card' | 'table') => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onViewChange }) => {
  return (
    <div className="bg-white border border-border p-1 rounded-xl flex items-center shadow-sm">
      <Button 
        variant={viewMode === 'card' ? 'secondary' : 'ghost'} 
        size="sm" 
        className={`rounded-lg h-8 px-3 font-bold text-[10px] uppercase tracking-wider ${
          viewMode === 'card' ? 'text-primary shadow-sm bg-primary/5' : 'text-muted-foreground'
        }`}
        onClick={() => onViewChange('card')}
      >
        <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Grid
      </Button>
      <Button 
        variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
        size="sm" 
        className={`rounded-lg h-8 px-3 font-bold text-[10px] uppercase tracking-wider ${
          viewMode === 'table' ? 'text-primary shadow-sm bg-primary/5' : 'text-muted-foreground'
        }`}
        onClick={() => onViewChange('table')}
      >
        <List className="w-3.5 h-3.5 mr-1.5" /> Table
      </Button>
    </div>
  );
};
