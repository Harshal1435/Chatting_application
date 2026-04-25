import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

// Read the theme synchronously — the inline script in index.html already applied
// the class, so we just need to match React state to whatever is on <html>.
const getInitialTheme = () => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch (_) {
    return 'light';
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  // Keep <html> class in sync whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Enable CSS transitions only after first mount so there's no transition
  // animation on page load / refresh.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-ready');
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    setTheme(next);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);