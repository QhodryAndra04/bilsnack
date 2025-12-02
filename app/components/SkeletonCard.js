import React from 'react';

// Simple skeleton placeholder for product card while loading
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="rounded-2xl bg-[rgb(var(--surface-alt))] h-56 w-full mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-[rgb(var(--border))] rounded w-3/4" />
      <div className="h-3 bg-[rgb(var(--border))] rounded w-1/2" />
      <div className="h-4 bg-[rgb(var(--border))] rounded w-1/3" />
    </div>
  </div>
);

export default SkeletonCard;