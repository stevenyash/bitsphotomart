'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </SessionProvider>
  );
}
