import React from 'react';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {children}
    </div>
  );
}
