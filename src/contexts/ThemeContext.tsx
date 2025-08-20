import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [primaryColor, setPrimaryColorState] = useState('#000000');
  const [isLoading, setIsLoading] = useState(true);

  const loadTheme = async () => {
    try {
      // First, try to load from localStorage for immediate application
      const storedColor = localStorage.getItem('theme-primary-color');
      if (storedColor) {
        setPrimaryColorState(storedColor);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("establishment_id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.establishment_id) {
        setIsLoading(false);
        return;
      }

      // Get establishment settings
      const { data: establishment } = await supabase
        .from("establishments")
        .select("settings")
        .eq("id", profile.establishment_id)
        .single();

      if (establishment?.settings?.theme_color) {
        setPrimaryColorState(establishment.settings.theme_color);
        // Update localStorage with the latest from database
        localStorage.setItem('theme-primary-color', establishment.settings.theme_color);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    
    // Apply CSS custom properties
    const root = document.documentElement;
    const hsl = hexToHsl(color);
    
    if (hsl) {
      // Apply the primary color and related shades
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      
      // Create a lighter version for glow
      const lighterL = Math.min(hsl.l + 10, 95);
      root.style.setProperty('--primary-glow', `${hsl.h} ${hsl.s}% ${lighterL}%`);
      
      // Store in localStorage for immediate access
      localStorage.setItem('theme-primary-color', color);
    }
  };

  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme color when it changes
    if (primaryColor !== '#000000') {
      setPrimaryColor(primaryColor);
    }
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
