'use client';

import { AISearch } from './ai-search';

interface AISearchWrapperProps {
  initialQuery?: string;
}

export function AISearchWrapper({ initialQuery = '' }: AISearchWrapperProps) {
  return (
    <AISearch 
      placeholder="Search photos, categories, or describe what you need..."
      className="w-full"
    />
  );
}

export default AISearchWrapper;
