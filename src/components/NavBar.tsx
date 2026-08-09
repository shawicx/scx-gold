/**
 * @description 顶部导航栏，通过 react-router NavLink 切换页面。
 *
 * 深色/浅色主题复用 ThemeToggle（由各页面 Header 自行放置，NavBar 不重复）。
 */

import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '涨停筛选器', end: true },
  { to: '/etf-analysis', label: 'ETF 支撑位分析', end: false },
];

export function NavBar() {
  return (
    <nav className="border-b border-border bg-surface">
      <div className="max-w-[2560px] mx-auto px-5 flex items-center gap-1 h-12">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface-hover text-accent'
                  : 'text-text-secondary hover:text-text hover:bg-surface-hover'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
