import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm"
      onClick={toggleTheme}
      aria-label="切换主题"
      title={theme === 'light' ? '切换到深色' : '切换到浅色'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
