/**
 * @description 应用根组件：路由编排 + 全局 Provider。
 *
 * 路由：
 *   /               → 涨停候选筛选器
 *   /etf-analysis   → ETF 支撑位分析
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { NavBar } from './components/NavBar';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { EtfAnalysisPage } from './pages/EtfAnalysisPage';
import { GoldPage } from './pages/GoldPage';
import { ScreenerPage } from './pages/ScreenerPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <WatchlistProvider>
          <NavBar />
          <Routes>
            <Route path="/" element={<ScreenerPage />} />
            <Route path="/etf-analysis" element={<EtfAnalysisPage />} />
            <Route path="/gold" element={<GoldPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </WatchlistProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
