import { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.style.backgroundColor = '#0F172A';
      document.body.style.color = '#F9FAFB';
    } else {
      document.body.style.backgroundColor = '#F9FAFB';
      document.body.style.color = '#111827';
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const theme = {
    bg: darkMode ? '#0F172A' : '#F9FAFB',
    cardBg: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#F9FAFB' : '#111827',
    textSecondary: darkMode ? '#9CA3AF' : '#6B7280',
    border: darkMode ? '#374151' : '#E5E7EB',
    inputBg: darkMode ? '#1E293B' : '#FFFFFF',
    inputBorder: darkMode ? '#374151' : '#E5E7EB',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    gradient: darkMode
      ? 'linear-gradient(135deg, #1E3A8A, #1E40AF)'
      : 'linear-gradient(135deg, #111827, #374151)',
    shadow: darkMode
      ? '0 20px 60px rgba(0, 0, 0, 0.4)'
      : '0 20px 60px rgba(0, 0, 0, 0.1)',
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Komponen tombol toggle dark mode yang bisa digunakan di halaman mana saja
export const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode, theme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleDarkMode}
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '50%',
        width: 48,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 20,
        color: theme.text,
        transition: 'all 0.3s ease',
      }}
    >
      {darkMode ? <FaSun /> : <FaMoon />}
    </motion.button>
  );
};
