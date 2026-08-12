/**
 * @description 授权码认证弹窗。
 *
 * 用户点「获取授权码」后，后端生成 16 位码并发到固定邮箱。
 * 用户从邮箱拿到码后在输入框填写，提交校验。
 */

import { useState } from 'react';
import {
  postApiV1AuthRequestCodeFunc,
  postApiV1AuthVerifyFunc,
} from '@/service';
import { ApiError } from '@/service/request';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const { authenticate } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCode = async () => {
    setRequesting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await postApiV1AuthRequestCodeFunc();
      if (result.sent) {
        setMessage(result.message || '授权码已发送到邮箱');
      } else {
        setError(result.message || '发送失败');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '请求授权码失败');
    } finally {
      setRequesting(false);
    }
  };

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 16) {
      setError('请输入 16 位授权码');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await postApiV1AuthVerifyFunc(trimmed);
      if (result.valid) {
        authenticate(trimmed);
      } else {
        setError(result.message || '授权码无效或已过期');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-border rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold m-0 mb-2">访问授权</h2>
        <p className="text-sm text-text-secondary m-0 mb-6">
          请点击下方按钮获取授权码，授权码将发送到邮箱。收到后在输入框填写。
        </p>

        {/* 获取授权码按钮 */}
        <button
          onClick={() => void handleRequestCode()}
          disabled={requesting}
          className={`w-full px-4 py-2.5 rounded-md text-sm font-medium mb-4 transition-colors ${
            requesting
              ? 'bg-surface-hover text-text-muted cursor-not-allowed'
              : 'bg-surface border border-accent text-accent hover:bg-accent hover:text-white'
          }`}
        >
          {requesting ? '发送中…' : '获取授权码'}
        </button>

        {/* 输入框 */}
        <div className="mb-3">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleVerify();
            }}
            placeholder="输入 16 位授权码"
            maxLength={16}
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-accent font-mono tracking-widest text-center"
          />
        </div>

        {/* 提示信息 */}
        {message && (
          <p className="text-xs text-down mb-3 m-0">{message}</p>
        )}
        {error && (
          <p className="text-xs text-error mb-3 m-0">{error}</p>
        )}

        {/* 验证按钮 */}
        <button
          onClick={() => void handleVerify()}
          disabled={loading || code.trim().length !== 16}
          className={`w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            loading || code.trim().length !== 16
              ? 'bg-surface-hover text-text-muted cursor-not-allowed'
              : 'bg-accent text-white hover:opacity-90'
          }`}
        >
          {loading ? '验证中…' : '进入系统'}
        </button>
      </div>
    </div>
  );
}
