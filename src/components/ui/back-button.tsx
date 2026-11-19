'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href, label = 'Go Back' }: BackButtonProps) {
  return (
    <Link 
      href={href || '/'} 
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
