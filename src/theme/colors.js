import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const accentThemes = {
  purple: { primary: '#8A2BE2', primaryLight: '#B983FF', borderActive: '#8A2BE2' },
  blue: { primary: '#2563EB', primaryLight: '#60A5FA', borderActive: '#3B82F6' },
  green: { primary: '#059669', primaryLight: '#34D399', borderActive: '#10B981' },
  pink: { primary: '#DB2777', primaryLight: '#F472B6', borderActive: '#EC4899' },
  gold: { primary: '#D97706', primaryLight: '#FBBF24', borderActive: '#F59E0B' }
};

let currentTheme = { ...accentThemes.purple };
let themeName = 'purple';
let listeners = [];

export const getThemeName = () => themeName;

export const registerThemeListener = (cb) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
};

const notifyListeners = () => {
  listeners.forEach(cb => cb(themeName));
};

export const changeTheme = async (name) => {
  if (accentThemes[name]) {
    currentTheme = { ...accentThemes[name] };
    themeName = name;
    try {
      await AsyncStorage.setItem('user_theme_accent_color', name);
    } catch (e) {
      console.error('AsyncStorage tema kaydetme hatası:', e);
    }
    notifyListeners();
  }
};

export const initTheme = async () => {
  try {
    const saved = await AsyncStorage.getItem('user_theme_accent_color');
    if (saved && accentThemes[saved]) {
      currentTheme = { ...accentThemes[saved] };
      themeName = saved;
      notifyListeners();
    }
  } catch (e) {
    console.error('Theme initialization error:', e);
  }
};

export const colors = {
  background: '#040406',        // Ultra derin sinema siyahı
  surface: '#0B0B11',           // İkincil çok koyu arka plan
  surfaceLight: '#12121C',      // Kart içi boşluklar / hafif aydınlık
  border: '#1E1E2D',            // Kenarlıklar için çok hafif belirgin gri
  borderLight: '#2C2C40',       // Hover veya focus durumları için daha açık kenarlık
  
  // Dinamik Temalar
  get primary() { return currentTheme.primary; },
  get primaryLight() { return currentTheme.primaryLight; },
  get borderActive() { return currentTheme.borderActive; },
  
  secondary: '#F43F5E',         // Canlı Gül Kurusu / Kırmızı (Silme ve uyarılar için daha yumuşak)
  accent: '#FBBF24',            // Parlak Altın Sarısı
  
  success: '#10B981',           // Mint Yeşili
  danger: '#EF4444',            // Hata Kırmızı
  info: '#3B82F6',              // Gökyüzü Mavisi
  
  text: '#F8FAFC',              // Göz yormayan, saf beyaz olmayan metin
  textSecondary: '#94A3B8',     // Kül grisi alt metinler
  textMuted: '#475569',         // İyice soluk, okuması çok dikkat gerektirmeyen veriler
  textDark: '#020617',          // Koyu metinler için
  
  // Glassmorphism Efektleri
  glassSurface: 'rgba(11, 11, 17, 0.65)',
  glassInput: 'rgba(18, 18, 28, 0.5)',
  glassFloating: 'rgba(20, 20, 30, 0.85)',
  
  get glassPill() {
    const hex = currentTheme.primary;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  },

  get glassGlow() {
    const hex = currentTheme.primary;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  },
  
  categories: {
    Film: '#3B82F6',
    Dizi: '#10B981',
    Anime: '#8A2BE2',
    'Kore Dizisi': '#EC4899',
    Varsayilan: '#64748B'
  }
};

export const layout = {
  borderRadius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    round: 9999
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 18,
    lg: 28,
    xl: 40
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    },
    md: {
      get shadowColor() { return currentTheme.primary; },
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8
    },
    lg: {
      get shadowColor() { return currentTheme.primary; },
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.35,
      shadowRadius: 32,
      elevation: 16
    }
  }
};
