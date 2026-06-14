// src/contexts/ThemeContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Read saved theme synchronously on first render — no flash/flicker
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark', 'dark-theme');
      body.classList.add('dark-theme');
    } else {
      root.classList.remove('dark', 'dark-theme');
      body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const value = {
    theme,
    toggleTheme,
  };

  const memoed = React.useMemo(() => value, [theme, toggleTheme]);

  return <ThemeContext.Provider value={memoed}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  return useContext(ThemeContext);
};