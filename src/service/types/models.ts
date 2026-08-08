/**
 * @description 后端领域模型类型定义（snake_case，与后端 Pydantic schema 对齐）。
 *
 * 后端 OpenAPI 把 ApiResponse.data 声明为 anyOf:[{}, null]，导致生成器产出 data: null。
 * 此文件手写真实返回类型，供各 service 模块引用。
 */

// ---------------------------------------------------------------------------
// 个股
// ---------------------------------------------------------------------------

/**
 * 股票/ETF 列表行情条目（对应后端 StockListItem）。
 */
export interface StockListItem {
  code: string;
  name: string;
  market: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  amount: number | null;
  volume: number | null;
  turnover_rate: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  prev_close: number | null;
  main_net_inflow: number | null;
  main_net_inflow_pct: number | null;
  industry: string | null;
}

/**
 * 股票列表分页数据（后端 /stock/list 的 data 结构）。
 */
export interface StockListData {
  items: StockListItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 个股详情中的基础信息。
 */
export interface StockDetailInfo {
  code: string;
  name: string;
  market: string;
  industry: string | null;
}

/**
 * 个股详情中的实时行情。
 */
export interface StockDetailQuote {
  code: string;
  name: string;
  price: number | null;
  prev_close: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
  amount: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  timestamp: string;
}

/**
 * 个股详情聚合响应（后端 /stock/{code} 的 data 结构）。
 */
export interface StockDetail {
  info: StockDetailInfo;
  quote: StockDetailQuote;
  fetched_at: string;
}

// ---------------------------------------------------------------------------
// 板块
// ---------------------------------------------------------------------------

/**
 * 行业板块行情条目（对应后端 SectorQuote）。
 */
export interface SectorQuote {
  code: string;
  name: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  total_market_cap: number | null;
  turnover_rate: number | null;
  up_count: number | null;
  down_count: number | null;
  leading_stock: string | null;
  leading_stock_change_pct: number | null;
}

/**
 * 板块详情（含成分股）。
 */
export interface SectorDetail {
  quote: SectorQuote;
  constituents: { code: string; name: string }[];
}

// ---------------------------------------------------------------------------
// 大盘指数
// ---------------------------------------------------------------------------

/**
 * 指数行情条目（对应后端 IndexQuote）。
 */
export interface IndexQuote {
  code: string;
  name: string;
  price: number | null;
  change_pct: number | null;
  change: number | null;
  volume: number | null;
  amount: number | null;
  amplitude: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  prev_close: number | null;
}

// ---------------------------------------------------------------------------
// 搜索
// ---------------------------------------------------------------------------

/**
 * 搜索结果条目。
 */
export interface SearchResult {
  code: string;
  name: string;
  market: string;
  type: string;
  score: number;
}
