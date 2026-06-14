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
    <header className="app-header">
      <div className="app-header__left">
        <h1 className="app-header__title">涨停候选筛选器</h1>
        <LastUpdated
          lastUpdated={lastUpdated}
          isStale={isStale}
          loading={loading}
        />
      </div>
      <div className="app-header__right">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
