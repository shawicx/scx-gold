/**
 * @description 统一响应包装（泛型版）。
 *
 * 后端所有接口返回 { code, message, data }，code===0 表示成功。
 */
export interface ApiResponse<T = unknown> {
  /** 业务码：0 成功，非 0 错误 */
  code: number;
  /** 描述信息，成功为 "ok" */
  message: string;
  /** 业务数据 */
  data: T | null;
}
