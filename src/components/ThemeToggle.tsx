import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="切换主题"
      title={theme === 'light' ? '切换到深色' : '切换到浅色'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
