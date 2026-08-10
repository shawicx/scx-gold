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

// ---------------------------------------------------------------------------
// 支撑位分析
// ---------------------------------------------------------------------------

/**
 * 单个支撑/压力位（对应后端 SupportLevel）。
 */
export interface SupportLevel {
  /** 价位 */
  price: number;
  /** 命中来源列表（如 MA20、BOLL下轨、20日低点） */
  sources: string[];
  /** 距离当前价的百分比（支撑为负，压力为正） */
  distance_pct: number;
  /** 强度标签：强 / 中 / 弱 */
  strength: string;
}

/**
 * 单只标的的完整分析结果（对应后端 AnalysisReport）。
 */
export interface AnalysisReport {
  code: string;
  name: string;
  trade_date: string | null;
  close: number | null;
  change_pct: number | null;
  support_1: SupportLevel | null;
  support_2: SupportLevel | null;
  resistance_1: SupportLevel | null;
  trend: string;
  ma20: number | null;
  ma60: number | null;
  summary: string;
  ok: boolean;
  error: string;
}

/**
 * 分析任务汇总结果（后端 /analysis/run 的 data 结构）。
 */
export interface AnalysisResult {
  analyzed: number;
  success: number;
  failed: number;
  sent: boolean;
  reports: AnalysisReport[];
  elapsed: number;
}

// ---------------------------------------------------------------------------
// 关注列表
// ---------------------------------------------------------------------------

/**
 * 关注列表条目（对应后端 WatchlistItem）。
 */
export interface WatchlistItemData {
  code: string;
  name: string;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// 应用配置
// ---------------------------------------------------------------------------

/**
 * 应用配置（GET 返回时敏感字段已脱敏）。
 */
export interface AppSettings {
  llm_provider: string | null;
  llm_api_key: string | null;
  llm_base_url: string | null;
  llm_model: string | null;
  llm_timeout: string | null;
  smtp_host: string | null;
  smtp_port: string | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from_name: string | null;
  smtp_use_ssl: string | null;
  notify_emails: string | null;
}

/**
 * LLM 测试连接结果。
 */
export interface LlmTestResult {
  success: boolean;
  message: string;
  reply: string;
}
