import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-8 rounded-full bg-surface-soft border border-border-main flex items-center p-1 transition-all duration-300 shadow-inner group ${className}`}
      aria-label="Toggle Dark Mode"
    >
      <div 
        className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          isDarkMode 
            ? 'translate-x-6 bg-brand-purple text-white' 
            : 'translate-x-0 bg-white text-brand-purple'
        } group-active:scale-90`}
      >
        {isDarkMode ? <Moon size={12} fill="currentColor" /> : <Sun size={12} fill="currentColor" />}
      </div>
    </button>
  );
};

export default ThemeToggle;
