import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const { user } = useAuth();

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Save to Supabase if user is logged in
    if (user) {
      supabase
        .from('users')
        .update({ theme_preference: theme })
        .eq('clerk_user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error saving theme preference:', error);
          }
        });
    }
  }, [theme, user]);

  useEffect(() => {
    // Load user's theme preference from Supabase
    if (user) {
      supabase
        .from('users')
        .select('theme_preference')
        .eq('clerk_user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data?.theme_preference && !error) {
            setTheme(data.theme_preference as Theme);
          }
        });
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};