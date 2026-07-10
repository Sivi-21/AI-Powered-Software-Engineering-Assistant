import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun size={18} style={{ transform: 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
      ) : (
        <Moon size={18} style={{ transform: 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
      )}
    </button>
  );
}
