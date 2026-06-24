import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const accentThemes = {
  purple: { primary: '#8A2BE2', primaryLight: '#A855F7', borderActive: '#8A2BE2' },
  blue: { primary: '#3B82F6', primaryLight: '#60A5FA', borderActive: '#3B82F6' },
  green: { primary: '#10B981', primaryLight: '#34D399', borderActive: '#10B981' },
  pink: { primary: '#EC4899', primaryLight: '#F472B6', borderActive: '#EC4899' },
  gold: { primary: '#FFB800', primaryLight: '#FBBF24', borderActive: '#FFB800' }
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

// AsyncStorage'dan temayı yükle
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
  background: '#06060A',        // Derin uzay siyahı / sinema arka planı
  surface: '#0F0F16',           // Kart ve yüzeylerin koyu eflatun-gri tonu
  surfaceLight: '#181824',      // Daha açık kart arka planı / input alanları
  border: '#222232',            // İnce kenarlık çizgileri
  
  // Dinamik Getter Rengleri
  get primary() { return currentTheme.primary; },
  get primaryLight() { return currentTheme.primaryLight; },
  get borderActive() { return currentTheme.borderActive; },
  
  secondary: '#FF2E93',         // Neon Pembe / Mercan (İkincil uyarı/vurgu)
  accent: '#FFB800',            // Sinematik Altın Sarısı (Puanlama ve yıldızlar)
  
  success: '#10B981',           // Yeşil (Başarılı bildirimler)
  danger: '#EF4444',            // Kırmızı (Hatalar ve silme butonları)
  info: '#3B82F6',              // Mavi (Bilgi durumları)
  
  text: '#FFFFFF',              // Birincil Beyaz Metin
  textSecondary: '#A1A1AA',     // İkincil Gri Metin
  textMuted: '#71717A',         // Soluk Yardımcı Metin
  textDark: '#06060A',          // Koyu metinler için
  
  // Cam efektli yarı saydam arka planlar
  glassSurface: 'rgba(15, 15, 22, 0.75)',
  glassInput: 'rgba(24, 24, 36, 0.5)',
  
  get glassPill() {
    const hex = currentTheme.primary;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  },
  
  // Kategori renkleri (Filtreleme ve kart rozetleri için)
  categories: {
    Film: '#3B82F6',            // Mavi
    Dizi: '#10B981',            // Yeşil
    Anime: '#8A2BE2',           // Mor
    'Kore Dizisi': '#EC4899',   // Pembe
    Varsayilan: '#71717A'
  }
};

export const layout = {
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    round: 9999
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2
    },
    md: {
      get shadowColor() { return currentTheme.primary; },
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6
    },
    lg: {
      get shadowColor() { return currentTheme.primary; },
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 12
    }
  }
};
