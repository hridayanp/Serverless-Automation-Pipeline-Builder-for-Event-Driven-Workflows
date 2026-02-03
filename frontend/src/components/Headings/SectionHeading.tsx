'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  description,
  showBackButton = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-start space-x-4">
      {showBackButton && (
        <div
          onClick={() => navigate(-1)}
          className="cursor-pointer transition hover:bg-gray-100 rounded-full p-2"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
    </div>
  );
};
