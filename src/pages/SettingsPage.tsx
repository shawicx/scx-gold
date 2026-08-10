/**
 * @description 应用配置页面：LLM 与 SMTP 配置，支持测试连接。
 *
 * 配置存后端 DB，保存后即时生效（无需重启）。
 */

import { useEffect, useRef, useState } from 'react';
import { Banner } from '@/components/Banner';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  getAdminTaskFunc,
  getApiV1SettingsFunc,
  postAdminReindexFunc,
  postAdminSyncFunc,
  postApiV1SettingsTestLlmFunc,
  putApiV1SettingsFunc,
  type SettingsUpdateRequest,
} from '@/service';
import type { AppSettings } from '@/service/types';

const PROVIDER_OPTIONS = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'glm', label: '智谱 GLM' },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // 本地编辑缓冲（用户输入未保存的值）
  const [draft, setDraft] = useState<SettingsUpdateRequest>({});

  // 运维操作状态
  const [syncing, setSyncing] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [reindexResult, setReindexResult] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress('正在提交任务…');
    try {
      // 1. 提交任务，立即拿到 task_id
      const submitResult = await postAdminSyncFunc();
      const taskId = submitResult.task_id;

      // 2. 轮询任务状态，每 3 秒一次
      const poll = async () => {
        try {
          const info = await getAdminTaskFunc(taskId);
          setSyncProgress(`${info.progress}（已耗时 ${info.elapsed}s）`);

          if (info.status === 'done') {
            const r = info.result || {};
            setSyncResult(
              `✓ 同步完成：股票 ${r.stock_count ?? '--'}，ETF ${r.etf_count ?? '--'}，行业 ${r.industry_count ?? '--'}，索引 ${r.index_size ?? '--'}`,
            );
            setSyncing(false);
            setSyncProgress(null);
            return;
          }
          if (info.status === 'failed') {
            setSyncResult(`✗ 同步失败：${info.error}`);
            setSyncing(false);
            setSyncProgress(null);
            return;
          }
          // pending / running：继续轮询
          pollRef.current = setTimeout(poll, 3000);
        } catch (e) {
          setSyncResult(`✗ 查询进度失败：${e instanceof Error ? e.message : '未知错误'}`);
          setSyncing(false);
          setSyncProgress(null);
        }
      };
      pollRef.current = setTimeout(poll, 1000);
    } catch (e) {
      setSyncResult(`✗ 提交任务失败：${e instanceof Error ? e.message : '未知错误'}`);
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  // 组件卸载时清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    setReindexResult(null);
    try {
      const result = await postAdminReindexFunc();
      setReindexResult(`✓ 重建索引完成：共 ${result.index_size} 条`);
    } catch (e) {
      setReindexResult(`✗ 重建失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setReindexing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getApiV1SettingsFunc();
        if (!cancelled) {
          setSettings(data);
          setDraft({});
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : '加载配置失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (key: keyof SettingsUpdateRequest, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  // 获取字段当前显示值：draft 优先，否则用 settings（GET 返回的脱敏值）
  const displayValue = (key: keyof AppSettings): string => {
    if (key in draft && draft[key as keyof SettingsUpdateRequest] !== undefined) {
      return draft[key as keyof SettingsUpdateRequest] as string;
    }
    return settings?.[key] ?? '';
  };

  const handleSave = async () => {
    if (Object.keys(draft).length === 0) {
      setError('没有需要保存的更改');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await putApiV1SettingsFunc(draft);
      // 重新加载配置（获取脱敏后的值）
      const data = await getApiV1SettingsFunc();
      setSettings(data);
      setDraft({});
      setSuccess('配置已保存，即时生效');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTestLlm = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await postApiV1SettingsTestLlmFunc();
      setTestResult(
        result.success
          ? `✓ ${result.message}（回复：${result.reply}）`
          : `✗ ${result.message}`,
      );
    } catch (e) {
      setTestResult(`✗ ${e instanceof Error ? e.message : '测试失败'}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-4 pb-10">
        <p className="text-text-secondary">加载配置中…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-4 pb-10">
      <header className="flex justify-between items-center pb-3 mb-4 border-b border-border">
        <h1 className="text-lg font-semibold m-0">应用配置</h1>
        <ThemeToggle />
      </header>

      {error && (
        <Banner type="error" message={error} onAction={() => setError(null)} actionLabel="关闭" />
      )}
      {success && (
        <Banner type="warning" message={success} onAction={() => setSuccess(null)} actionLabel="关闭" />
      )}

      {/* LLM 配置 */}
      <section className="bg-surface border border-border rounded-lg p-5 shadow-[var(--shadow)] mb-4">
        <h2 className="text-base font-semibold m-0 mb-4">LLM 配置</h2>
        <div className="space-y-4">
          {/* Provider */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              提供商
            </label>
            <select
              value={displayValue('llm_provider')}
              onChange={(e) => updateField('llm_provider', e.target.value)}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              API Key
            </label>
            <input
              type="password"
              value={displayValue('llm_api_key')}
              onChange={(e) => updateField('llm_api_key', e.target.value)}
              placeholder="sk-..."
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
            />
            <p className="text-xs text-text-muted mt-1">
              {settings?.llm_api_key && !('llm_api_key' in draft)
                ? '已配置（修改请重新输入完整 Key）'
                : '从提供商控制台获取'}
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Base URL
            </label>
            <input
              type="text"
              value={displayValue('llm_base_url')}
              onChange={(e) => updateField('llm_base_url', e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              模型
            </label>
            <input
              type="text"
              value={displayValue('llm_model')}
              onChange={(e) => updateField('llm_model', e.target.value)}
              placeholder="deepseek-chat"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
            />
          </div>

          {/* 测试连接 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleTestLlm()}
              disabled={testing}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                testing
                  ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                  : 'bg-surface border border-accent text-accent hover:bg-accent hover:text-white'
              }`}
            >
              {testing ? '测试中…' : '测试连接'}
            </button>
            {testResult && (
              <span
                className={`text-sm ${
                  testResult.startsWith('✓') ? 'text-down' : 'text-error'
                }`}
              >
                {testResult}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* SMTP 配置 */}
      <section className="bg-surface border border-border rounded-lg p-5 shadow-[var(--shadow)] mb-4">
        <h2 className="text-base font-semibold m-0 mb-4">邮件配置（SMTP）</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                SMTP 主机
              </label>
              <input
                type="text"
                value={displayValue('smtp_host')}
                onChange={(e) => updateField('smtp_host', e.target.value)}
                placeholder="smtp.qq.com"
                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                端口
              </label>
              <input
                type="text"
                value={displayValue('smtp_port')}
                onChange={(e) => updateField('smtp_port', e.target.value)}
                placeholder="465"
                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              SMTP 账号
            </label>
            <input
              type="text"
              value={displayValue('smtp_user')}
              onChange={(e) => updateField('smtp_user', e.target.value)}
              placeholder="xxx@qq.com"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              SMTP 密码 / 授权码
            </label>
            <input
              type="password"
              value={displayValue('smtp_password')}
              onChange={(e) => updateField('smtp_password', e.target.value)}
              placeholder="授权码"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              收件人邮箱（逗号分隔）
            </label>
            <input
              type="text"
              value={displayValue('notify_emails')}
              onChange={(e) => updateField('notify_emails', e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
            />
          </div>
        </div>
      </section>

      {/* 运维操作 */}
      <section className="bg-surface border border-border rounded-lg p-5 shadow-[var(--shadow)] mb-4">
        <h2 className="text-base font-semibold m-0 mb-2">运维操作</h2>
        <p className="text-xs text-text-muted mb-4 m-0">
          全量同步会从数据源拉取股票/ETF/行业映射并重建搜索索引，耗时约 1~2 分钟。
          重建索引仅从数据库重新加载，不拉取数据源，耗时几秒。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => void handleSync()}
            disabled={syncing}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              syncing
                ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                : 'bg-surface border border-accent text-accent hover:bg-accent hover:text-white'
            }`}
          >
            {syncing ? '同步中…' : '全量同步'}
          </button>
          {syncProgress && (
            <span className="text-sm text-accent">{syncProgress}</span>
          )}
          {syncResult && (
            <span
              className={`text-sm ${
                syncResult.startsWith('✓') ? 'text-down' : 'text-error'
              }`}
            >
              {syncResult}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            onClick={() => void handleReindex()}
            disabled={reindexing}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              reindexing
                ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                : 'bg-surface border border-accent text-accent hover:bg-accent hover:text-white'
            }`}
          >
            {reindexing ? '重建中…' : '重建搜索索引'}
          </button>
          {reindexResult && (
            <span
              className={`text-sm ${
                reindexResult.startsWith('✓') ? 'text-down' : 'text-error'
              }`}
            >
              {reindexResult}
            </span>
          )}
        </div>
      </section>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setDraft({});
            setSuccess(null);
            setError(null);
          }}
          disabled={Object.keys(draft).length === 0}
          className="px-4 py-2 rounded-md text-sm border border-border text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
        >
          重置
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={saving || Object.keys(draft).length === 0}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            saving || Object.keys(draft).length === 0
              ? 'bg-surface-hover text-text-muted cursor-not-allowed'
              : 'bg-accent text-white hover:opacity-90'
          }`}
        >
          {saving ? '保存中…' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
