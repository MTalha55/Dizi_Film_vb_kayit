export const colors = {
  background: '#06060A',        // Derin uzay siyahı / sinema arka planı
  surface: '#0F0F16',           // Kart ve yüzeylerin koyu eflatun-gri tonu
  surfaceLight: '#181824',      // Daha açık kart arka planı / input alanları
  border: '#222232',            // İnce kenarlık çizgileri
  borderActive: '#8A2BE2',      // Aktif odaklanmış alan çizgileri
  
  primary: '#8A2BE2',           // Canlı Neon Mor (Ana tema rengi)
  primaryLight: '#A855F7',      // Açık Mor (Vurgular ve hover/tıklama efektleri)
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
  glassPill: 'rgba(138, 43, 226, 0.1)',
  
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
      shadowColor: '#8A2BE2',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6
    },
    lg: {
      shadowColor: '#8A2BE2',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 12
    }
  }
};
