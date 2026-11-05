import React from 'react';

export const LoadingSpinner = ({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) => {
  const ring = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-[3px]' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${ring[size]} border-slate-200 border-t-blue-600 rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
    </div>
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[320px]">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="animate-pulse">
    <div className="bg-slate-50 border-b border-slate-200 flex gap-4 px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-200 rounded-full flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-4 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className={`h-3.5 bg-slate-100 rounded-full flex-1 ${j === 0 ? 'max-w-[140px]' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);
