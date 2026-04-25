import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type LucideIcon } from 'lucide-react';

interface TabOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedTabsProps {
  options: TabOption[];
  className?: string;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({ options, className = "" }) => {
  return (
    <div className={`bg-white border border-border p-1 rounded-xl inline-flex items-center shadow-sm ${className}`}>
      <TabsList className="bg-transparent h-auto p-0 gap-1 flex">
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="rounded-lg h-8 px-4 font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-primary hover:bg-primary/5 border-none"
          >
            {option.icon && <option.icon className="w-3.5 h-3.5 mr-1.5" />}
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};
