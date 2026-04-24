import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-8 rounded-full bg-surface-soft border border-border-dark flex items-center p-1 transition-colors duration-300 ${className}`}
      aria-label="Toggle Dark Mode"
    >
      <div 
        className={`w-6 h-6 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isDarkMode 
            ? 'translate-x-6 bg-brand-purple text-white' 
            : 'translate-x-0 bg-white text-brand-purple'
        }`}
      >
        {isDarkMode ? <Moon size={14} fill="currentColor" /> : <Sun size={14} fill="currentColor" />}
      </div>
    </button>
  );
};

export default ThemeToggle;
