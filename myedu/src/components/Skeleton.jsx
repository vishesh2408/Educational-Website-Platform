import React from 'react';

// Reusable skeleton loader
export default function Skeleton({ variant = 'card', count = 1 }) {
  const Card = () => (
    <div className="mx-auto w-full max-w-sm rounded-md border border-blue-300 p-4">
      <div className="flex animate-pulse space-x-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="flex-1 space-y-6 py-1">
          <div className="h-2 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 h-2 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="col-span-1 h-2 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="h-2 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const ListItem = () => (
    <div className="w-full p-4 border border-border rounded-md bg-card animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  );

  const GridCard = () => (
    <div className="rounded-lg overflow-hidden shadow-sm border border-border p-0">
      <div className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
  );

  const nodes = Array.from({ length: count }).map((_, i) => {
    switch (variant) {
      case 'list':
        return <ListItem key={i} />;
      case 'grid':
        return <GridCard key={i} />;
      default:
        return <Card key={i} />;
    }
  });

  return (
    <div className={`skeleton-wrapper grid gap-4 ${variant === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
      {nodes}
    </div>
  );
}
