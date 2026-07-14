import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-card p-4 rounded-xl flex flex-col relative animate-pulse">
    <div className="w-full aspect-square bg-white/10 rounded-md mb-4"></div>
    <div className="h-5 bg-white/10 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-white/10 rounded w-1/2"></div>
  </div>
);

export const RowSkeleton = () => (
  <div className="flex items-center gap-4 bg-white/5 p-2 rounded-md animate-pulse">
    <div className="w-12 h-12 bg-white/10 rounded-md"></div>
    <div className="flex-1">
      <div className="h-4 bg-white/10 rounded w-48 mb-2"></div>
      <div className="h-3 bg-white/10 rounded w-24"></div>
    </div>
  </div>
);

export const QuickPickSkeleton = () => (
  <div className="glass-card flex items-center rounded-md overflow-hidden animate-pulse">
    <div className="h-20 w-20 bg-white/10"></div>
    <div className="ml-4 h-5 bg-white/10 rounded w-32"></div>
  </div>
);
