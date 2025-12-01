import React from 'react';

// Simple skeleton placeholder for product card while loading
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="rounded-2xl bg-gray-100 dark:bg-neutral-800 h-56 w-full mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/3" />
    </div>
  </div>
);

export default SkeletonCard;