import { Banner } from './components/Banner';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { HighlightCards } from './components/HighlightCards';
import { StockTable } from './components/StockTable';
import { FilterProvider, useFilters } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { useScreener } from './hooks/useScreener';
import { useSort } from './hooks/useSort';
import { useTradingHours } from './hooks/useTradingHours';

function AppInner() {
  const { filters } = useFilters();
  const isTrading = useTradingHours();
  const screener = useScreener(filters, isTrading);
  const sort = useSort();

  return (
    <div className="app">
      <Header
        lastUpdated={screener.lastUpdated}
        isStale={screener.isStale}
        loading={screener.loading}
      />

      {screener.error && (
        <Banner
          type="error"
          message={`获取行情失败：${screener.error.message}`}
          onAction={screener.refresh}
          actionLabel="重试"
        />
      )}

      {!isTrading && screener.lastUpdated && !screener.error && (
        <Banner
          type="warning"
          message="当前非交易时段，显示最近一次快照"
        />
      )}

      <FilterBar
        onRefresh={screener.refresh}
        loading={screener.loading}
        isTrading={isTrading}
      />

      <HighlightCards stocks={screener.stocks} />

      <StockTable
        stocks={screener.stocks}
        sort={sort.state}
        onSort={sort.toggle}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <FilterProvider>
        <AppInner />
      </FilterProvider>
    </ThemeProvider>
  );
}
