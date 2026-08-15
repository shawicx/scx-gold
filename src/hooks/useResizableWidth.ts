/**
 * @description 面板宽度拖拽调整 hook，宽度持久化到 localStorage。
 *
 * 为分栏布局提供拖拽把手逻辑：pointerdown 后跟随指针改宽，
 * 松开时写入 localStorage；支持键盘微调（←/→，Shift 加速）与双击恢复默认。
 * 响应式显隐（如 lg:flex）由调用方在把手上用工具类控制。
 */

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

/** 拖拽配置项 */
export interface ResizableWidthOptions {
  /** localStorage 持久化键 */
  storageKey: string;
  /** 默认宽度（px），双击恢复到此值 */
  defaultWidth: number;
  /** 最小宽度（px） */
  minWidth: number;
  /** 最大宽度（px） */
  maxWidth: number;
}

/** 绑定到拖拽把手元素上的事件回调集合 */
export interface ResizeHandleProps {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
}

/** hook 返回值 */
export interface ResizableWidthResult {
  /** 当前面板宽度（px），调用方通过 CSS 变量应用到布局 */
  width: number;
  /** 是否正在拖拽 */
  isResizing: boolean;
  /** 绑定到拖拽把手的 props */
  handleProps: ResizeHandleProps;
}

/**
 * @description 把宽度约束到 [min, max] 区间。
 * @param value 待约束的宽度值（px）
 * @param min 最小宽度（px）
 * @param max 最大宽度（px）
 * @returns number 约束后的宽度值（px）
 */
function clampWidth(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * @description 从 localStorage 读取持久化的宽度。
 * @param storageKey 持久化键
 * @param min 最小宽度（px），低于此值视为非法
 * @param max 最大宽度（px），高于此值视为非法
 * @returns number | null 合法宽度；无缓存或非法时返回 null
 */
function readStoredWidth(
  storageKey: string,
  min: number,
  max: number,
): number | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * @description 可拖拽调整宽度的面板 hook。
 *
 * pointerdown 开始拖拽 → pointermove 实时改宽 → pointerup/pointercancel
 * 结束并持久化；拖拽期间锁定 body 的光标与文本选择。键盘 ←/→ 每次
 * 调整 16px（Shift 加速 48px），双击把手恢复默认宽度，均立即持久化。
 *
 * @param options 拖拽配置（storageKey / defaultWidth / minWidth / maxWidth）
 * @returns ResizableWidthResult 当前宽度、拖拽状态与把手事件 props
 *
 * @example
 * const { width, isResizing, handleProps } = useResizableWidth({
 *   storageKey: 'scx-gold.etf-sidebar-width',
 *   defaultWidth: 320,
 *   minWidth: 240,
 *   maxWidth: 560,
 * });
 * // <div style={{ '--etf-sidebar-w': `${width}px` }} />
 * // <div role="separator" {...handleProps} />
 */
export function useResizableWidth(
  options: ResizableWidthOptions,
): ResizableWidthResult {
  const { storageKey, defaultWidth, minWidth, maxWidth } = options;

  const [width, setWidth] = useState(
    () => readStoredWidth(storageKey, minWidth, maxWidth) ?? defaultWidth,
  );
  const [isResizing, setIsResizing] = useState(false);

  // 拖拽期间的宽度走 ref，避免 pointermove 高频 setState 读到过期闭包
  const widthRef = useRef(width);
  widthRef.current = width;

  /**
   * @description 更新宽度并立即持久化（用于键盘调整 / 双击恢复）。
   * @param next 下一次宽度值（px）
   * @returns void
   */
  const updateWidth = useCallback(
    (next: number) => {
      const clamped = clampWidth(next, minWidth, maxWidth);
      setWidth(clamped);
      try {
        window.localStorage.setItem(storageKey, String(clamped));
      } catch {
        // localStorage 不可用（如隐私模式）时只保留内存态
      }
    },
    [storageKey, minWidth, maxWidth],
  );

  /**
   * @description 把手 pointerdown：开始拖拽，注册窗口级 move/up 监听。
   * @param e 把手上的指针事件
   * @returns void
   */
  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      // 注意：不能 preventDefault，否则会抑制 mousedown/click/dblclick，
      // 导致同一把手上的「双击恢复默认」失效；拖拽防选中由 body userSelect 锁处理
      const startX = e.clientX;
      const startWidth = widthRef.current;
      setIsResizing(true);

      const { body } = document;
      const prevCursor = body.style.cursor;
      const prevUserSelect = body.style.userSelect;
      body.style.cursor = 'col-resize';
      body.style.userSelect = 'none';

      /**
       * @description 拖拽 move：按水平位移实时改宽。
       * @param ev 窗口 pointermove 事件
       * @returns void
       */
      const onMove = (ev: PointerEvent) => {
        setWidth(clampWidth(startWidth + ev.clientX - startX, minWidth, maxWidth));
      };

      /**
       * @description 拖拽结束：恢复 body 样式并持久化最终宽度。
       * @returns void
       */
      const onFinish = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onFinish);
        window.removeEventListener('pointercancel', onFinish);
        body.style.cursor = prevCursor;
        body.style.userSelect = prevUserSelect;
        setIsResizing(false);
        try {
          window.localStorage.setItem(storageKey, String(widthRef.current));
        } catch {
          // 同上：localStorage 不可用时跳过持久化
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onFinish);
      window.addEventListener('pointercancel', onFinish);
    },
    [storageKey, minWidth, maxWidth],
  );

  /**
   * @description 双击把手：恢复默认宽度。
   * @returns void
   */
  const onDoubleClick = useCallback(() => {
    updateWidth(defaultWidth);
  }, [updateWidth, defaultWidth]);

  /**
   * @description 键盘调整：← 收窄 / → 加宽，Shift 加速。
   * @param e 把手上的键盘事件
   * @returns void
   */
  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      const step = e.shiftKey ? 48 : 16;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateWidth(widthRef.current - step);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateWidth(widthRef.current + step);
      }
    },
    [updateWidth],
  );

  return {
    width,
    isResizing,
    handleProps: { onPointerDown, onDoubleClick, onKeyDown },
  };
}
