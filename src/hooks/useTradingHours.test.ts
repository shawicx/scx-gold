import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTradingHours } from './useTradingHours';

afterEach(() => {
  vi.useRealTimers();
});

describe('useTradingHours', () => {
  it('returns true during morning session (10:30 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:30:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(true);
  });

  it('returns true during afternoon session (14:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T14:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(true);
  });

  it('returns false during lunch break (12:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false before open (09:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T09:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false after close (16:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T16:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false on Saturday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T10:30:00+08:00')); // Sat
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false on Sunday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T10:30:00+08:00')); // Sun
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });
});
