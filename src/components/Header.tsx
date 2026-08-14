import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LastUpdated } from './LastUpdated';

interface HeaderProps {
  lastUpdated: Date | null;
  isStale: boolean;
  loading: boolean;
  children?: ReactNode;
}

export function Header({ lastUpdated, isStale, loading, children }: HeaderProps) {
  return (
    <header className="flex justify-between items-center pb-3 mb-4 border-b border-border">
      <div className="flex flex-col">
        <h1 className="text-base md:text-lg font-semibold m-0 mb-1">涨停候选筛选器</h1>
        <LastUpdated
          lastUpdated={lastUpdated}
          isStale={isStale}
          loading={loading}
        />
      </div>
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
