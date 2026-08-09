/**
 * @description 涨停候选筛选器页面（原 AppInner 逻辑，抽离为独立页面组件）。
 *
 * 逻辑与原 App.tsx 完全一致，仅做物理拆分以支持路由。
 */

import { Banner } from '@/components/Banner';
import { FilterBar } from '@/components/FilterBar';
import { Header } from '@/components/Header';
import { HighlightCards } from '@/components/HighlightCards';
import { StockTable } from '@/components/StockTable';
import { FilterProvider, useFilters } from '@/context/FilterContext';
import { useScreener } from '@/hooks/useScreener';
import { useSort } from '@/hooks/useSort';
import { useTradingHours } from '@/hooks/useTradingHours';

function ScreenerPageInner() {
  const { filters } = useFilters();
  const isTrading = useTradingHours();
  const screener = useScreener(filters, isTrading);
  const sort = useSort();

  return (
    <div className="max-w-[2560px] mx-auto px-5 pt-4 pb-10">
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
        <Banner type="warning" message="当前非交易时段，显示最近一次快照" />
      )}

      <FilterBar
        onRefresh={screener.refresh}
        loading={screener.loading}
        isTrading={isTrading}
      />

      <HighlightCards stocks={screener.stocks} />

      <StockTable stocks={screener.stocks} sort={sort.state} onSort={sort.toggle} />
    </div>
  );
}

export function ScreenerPage() {
  return (
    <FilterProvider>
      <ScreenerPageInner />
    </FilterProvider>
  );
}
