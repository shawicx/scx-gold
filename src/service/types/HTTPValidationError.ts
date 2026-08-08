import type { ValidationError } from '@/service/types/index';

/**
 * @description HTTPValidationError
 */
export interface HTTPValidationError {
  /** @description  */
  detail?: ValidationError[];
}
