// src/services/tmdb.js
// TMDB API entegrasyonu için servis dosyası

// TODO: Bu API Anahtarını geçerli bir anahtarla değiştireceğiz.
const API_KEY = '90a28d316d19f4778ba4c4828d31eb45'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Film veya dizi arar.
 * @param {string} query Arama terimi
 * @param {string} type 'movie' veya 'tv'
 */
export const searchTMDB = async (query, type = 'movie') => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/${type}?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB Arama Hatası:', error);
    return [];
  }
};

/**
 * ID'ye göre detayları getirir (Türler vb. için)
 */
export const getDetailsTMDB = async (id, type = 'movie') => {
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=tr-TR`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('TMDB Detay Hatası:', error);
    return null;
  }
};

/**
 * TMDB'den dönen resim yolunu tam URL'ye çevirir
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  return `${IMAGE_BASE_URL}${path}`;
};
