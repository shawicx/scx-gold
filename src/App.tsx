/**
 * @description 应用根组件：路由编排 + 全局 Provider。
 *
 * 路由：
 *   /               → 涨停候选筛选器
 *   /etf-analysis   → ETF、个股分析
 *   /gold           → 黄金行情
 *   /settings       → 应用配置
 *
 * 未认证（无授权码）时显示 AuthModal 弹窗。
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthModal } from './components/AuthModal';
import { NavBar } from './components/NavBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { EtfAnalysisPage } from './pages/EtfAnalysisPage';
import { GoldPage } from './pages/GoldPage';
import { ScreenerPage } from './pages/ScreenerPage';
import { SettingsPage } from './pages/SettingsPage';

function AppInner() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<ScreenerPage />} />
          <Route path="/etf-analysis" element={<EtfAnalysisPage />} />
          <Route path="/gold" element={<GoldPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>

      {/* 未认证时显示授权码弹窗 */}
      {!isAuthenticated && <AuthModal />}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WatchlistProvider>
          <AppInner />
        </WatchlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
