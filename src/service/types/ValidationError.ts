/**
 * @description ValidationError
 */
export interface ValidationError {
  /** @description  */
  loc: string | number[];
  /** @description  */
  msg: string;
  /** @description  */
  type: string;
  /** @description  */
  input?: any;
  /** @description  */
  ctx?: Record<string, any>;
}
