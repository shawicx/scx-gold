/**
 * @description 认证 Context，管理授权码的存储与校验。
 *
 * 授权码存 localStorage，每次请求通过 request.ts 注入 X-Access-Token 头。
 * 未认证时显示 AuthModal 弹窗。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'scx-gold.access-token';

interface AuthContextValue {
  /** 当前授权码（已认证时非空） */
  token: string | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 认证成功后存入 token */
  authenticate: (token: string) => void;
  /** 退出登录（清除 token） */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(loadToken);

  // token 变化时同步到 localStorage
  useEffect(() => {
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

  const authenticate = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: token !== null,
        authenticate,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
