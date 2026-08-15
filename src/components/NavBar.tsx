/**
 * @description 顶部导航栏，通过 react-router NavLink 切换页面。
 *
 * 右侧含退出按钮（清除授权码）。
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: '涨停筛选器', end: true },
  { to: '/etf-analysis', label: 'ETF、个股分析', end: false },
  { to: '/gold', label: '黄金', end: false },
  { to: '/settings', label: '设置', end: false },
];

export function NavBar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="border-b border-border bg-surface">
      <div className="max-w-[2560px] mx-auto px-4 md:px-5 flex items-center h-12">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
        {isAuthenticated && (
          <button
            onClick={logout}
            className="flex-shrink-0 ml-2 text-xs text-text-muted hover:text-error transition-colors"
            title="退出登录"
          >
            退出
          </button>
        )}
      </div>
    </nav>
  );
}
