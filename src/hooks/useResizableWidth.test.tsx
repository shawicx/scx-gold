/**
 * @description useResizableWidth hook 单测：指针拖拽、范围夹取、双击恢复、键盘调整与 localStorage 持久化。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { useResizableWidth } from './useResizableWidth';

const STORAGE_KEY = 'test.sidebar-width';

/** 把 hook 挂到探针组件上，便于对把手元素派发真实 DOM 事件 */
function Probe() {
  const { width, isResizing, handleProps } = useResizableWidth({
    storageKey: STORAGE_KEY,
    defaultWidth: 320,
    minWidth: 240,
    maxWidth: 560,
  });
  return (
    <>
      <div data-testid="panel" style={{ width }} />
      <div data-testid="resizing">{String(isResizing)}</div>
      <div data-testid="handle" {...handleProps} />
    </>
  );
}

/** 读取探针面板当前宽度 */
function panelWidth(): number {
  const el = screen.getByTestId('panel');
  return parseInt((el as HTMLElement).style.width, 10);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('useResizableWidth', () => {
  it('无持久化时使用默认宽度', () => {
    render(<Probe />);
    expect(panelWidth()).toBe(320);
  });

  it('初始化时读取 localStorage 中合法的宽度', () => {
    window.localStorage.setItem(STORAGE_KEY, '480');
    render(<Probe />);
    expect(panelWidth()).toBe(480);
  });

  it('指针拖拽按位移改宽，pointerup 后持久化', () => {
    render(<Probe />);
    const handle = screen.getByTestId('handle');

    fireEvent.pointerDown(handle, { clientX: 400 });
    expect(screen.getByTestId('resizing').textContent).toBe('true');

    // 向右拖 100px：320 → 420
    fireEvent.pointerMove(window, { clientX: 500 });
    expect(panelWidth()).toBe(420);

    fireEvent.pointerUp(window);
    expect(screen.getByTestId('resizing').textContent).toBe('false');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('420');
  });

  it('拖拽宽度被夹取到 [min, max] 区间', () => {
    render(<Probe />);
    const handle = screen.getByTestId('handle');

    fireEvent.pointerDown(handle, { clientX: 400 });
    fireEvent.pointerMove(window, { clientX: 4000 });
    expect(panelWidth()).toBe(560);

    fireEvent.pointerMove(window, { clientX: -4000 });
    expect(panelWidth()).toBe(240);

    fireEvent.pointerUp(window);
  });

  it('双击把手恢复默认宽度并持久化', () => {
    window.localStorage.setItem(STORAGE_KEY, '480');
    render(<Probe />);
    expect(panelWidth()).toBe(480);

    fireEvent.doubleClick(screen.getByTestId('handle'));
    expect(panelWidth()).toBe(320);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('320');
  });

  it('键盘 ←/→ 调整宽度（Shift 加速）', () => {
    render(<Probe />);
    const handle = screen.getByTestId('handle');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(panelWidth()).toBe(336);

    fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });
    expect(panelWidth()).toBe(384);

    fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true });
    expect(panelWidth()).toBe(336);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('336');
  });
});
