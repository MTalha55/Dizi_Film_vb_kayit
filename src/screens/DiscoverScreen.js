import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import { getImageUrl } from '../services/tmdb';

const API_KEY = '90a28d316d19f4778ba4c4828d31eb45'; 
const BASE_URL = 'https://api.themoviedb.org/3';

const DiscoverScreen = ({ navigation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Önce kullanıcının kayıtlarını alalım.
      // Firestore index hatasını önlemek için sadece userId ile sorgulayıp bellekte filtreliyoruz.
      const q = query(
        collection(db, 'records'), 
        where('userId', '==', auth.currentUser?.uid)
      );
      const snap = await getDocs(q);
      
      let sourceTmdbId = null;
      let isMovie = true;

      if (!snap.empty) {
        const records = snap.docs.map(doc => doc.data());
        // 4 veya 5 yıldız verdiklerinden birini bul
        const topRecords = records.filter(r => r.rating >= 4);
        
        if (topRecords.length > 0) {
          const topRecord = topRecords[Math.floor(Math.random() * topRecords.length)];
          isMovie = (topRecord.category !== 'Dizi' && topRecord.category !== 'Kore Dizisi');
          
          // TMDB'de adıyla arayıp ilk çıkanın ID'sini alalım
          const searchRes = await fetch(`${BASE_URL}/search/${isMovie ? 'movie' : 'tv'}?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(topRecord.title)}`);
          const searchData = await searchRes.json();
          
          if (searchData.results && searchData.results.length > 0) {
            sourceTmdbId = searchData.results[0].id;
          }
        }
      }

      let url = '';
      if (sourceTmdbId) {
        // O filme benzer filmler öner
        url = `${BASE_URL}/${isMovie ? 'movie' : 'tv'}/${sourceTmdbId}/recommendations?api_key=${API_KEY}&language=tr-TR&page=1`;
      } else {
        // Hiç kaydı yoksa haftanın trendlerini öner
        url = `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=tr-TR`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setRecommendations(data.results || []);

    } catch (error) {
      console.error('Önerileri alırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      // Detayları görmek isterse diye bir şeyler yapılabilir ama şimdilik sadece gösterelim.
    >
      <Image 
        source={{ uri: item.poster_path ? getImageUrl(item.poster_path) : 'https://via.placeholder.com/150' }} 
        style={styles.poster}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title || item.name}</Text>
        <Text style={styles.year}>{(item.release_date || item.first_air_date || '').substring(0, 4)}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.vote_average?.toFixed(1)}/10</Text>
        </View>
        <Text style={styles.overview} numberOfLines={3}>{item.overview || 'Özet bulunmuyor.'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yapay Zeka Önerileri 🤖</Text>
        <Text style={styles.headerSub}>Sevdiğin yapımlara göre senin için seçtiklerimiz</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Text style={styles.emptyText}>Öneri bulunamadı.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: layout.spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.textMuted },
  list: { padding: layout.spacing.md, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: layout.borderRadius.md,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  poster: {
    width: 100,
    height: 150,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  year: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  overview: {
    fontSize: 12,
    color: colors.textMuted,
  }
});

export default DiscoverScreen;
