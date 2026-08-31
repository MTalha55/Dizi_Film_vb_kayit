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
  Platform,
  Modal,
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import { getImageUrl } from '../services/tmdb';

// API Anahtarı .env dosyasından okunur
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DiscoverScreen = ({ navigation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addCategory, setAddCategory] = useState('Film');
  const [addStatus, setAddStatus] = useState('İzleyeceğim');
  const [addRating, setAddRating] = useState(3);
  const [addSeason, setAddSeason] = useState(1);
  const [addEpisode, setAddEpisode] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'records'), 
        where('userId', '==', auth.currentUser?.uid)
      );
      const snap = await getDocs(q);
      
      let sourceTmdbId = null;
      let isMovie = true;

      if (!snap.empty) {
        const records = snap.docs.map(doc => doc.data());
        const topRecords = records.filter(r => r.rating >= 4);
        
        if (topRecords.length > 0) {
          const topRecord = topRecords[Math.floor(Math.random() * topRecords.length)];
          isMovie = (topRecord.category !== 'Dizi' && topRecord.category !== 'Kore Dizisi');
          
          const searchRes = await fetch(`${BASE_URL}/search/${isMovie ? 'movie' : 'tv'}?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(topRecord.title)}`);
          const searchData = await searchRes.json();
          
          if (searchData.results && searchData.results.length > 0) {
            sourceTmdbId = searchData.results[0].id;
          }
        }
      }

      let url = '';
      if (sourceTmdbId) {
        url = `${BASE_URL}/${isMovie ? 'movie' : 'tv'}/${sourceTmdbId}/recommendations?api_key=${API_KEY}&language=tr-TR&page=1`;
      } else {
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

  const notify = (title, message, isSuccess = false) => {
    if (Platform.OS === 'web') {
      alert(`${isSuccess ? '✅' : '❌'} ${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleOpenDetail = async (item) => {
    // Otomatik kategori tahmini: media_type veya varsa
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    let predictedCategory = mediaType === 'tv' ? 'Dizi' : 'Film';
    
    if (mediaType === 'tv' && item.origin_country && item.origin_country.includes('KR')) {
      predictedCategory = 'Kore Dizisi';
    } else if (item.origin_country && item.origin_country.includes('JP') && item.genre_ids && item.genre_ids.includes(16)) {
      predictedCategory = 'Anime';
    }

    setAddCategory(predictedCategory);
    setAddStatus('İzleyeceğim');
    setAddRating(3);
    setAddSeason(1);
    setAddEpisode(1);
    setSelectedItem(item);
    setModalVisible(true);

    // Eğer dizi ise TMDB'den ekstra detayları (toplam sezon/bölüm) asenkron olarak çek
    if (mediaType === 'tv' && item.id) {
      try {
        const detailRes = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}&language=tr-TR`);
        const detailData = await detailRes.json();
        if (detailData.number_of_seasons !== undefined) {
          setSelectedItem(prev => {
            // Modal hala açık ve aynı diziye bakıyorsak güncelle
            if (prev && prev.id === item.id) {
              return {
                ...prev,
                total_seasons: detailData.number_of_seasons,
                total_episodes: detailData.number_of_episodes
              };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Dizi detayları alınamadı:", error);
      }
    }
  };

  const handleAddToList = async () => {
    if (!selectedItem || !auth.currentUser) return;
    
    setAdding(true);
    try {
      const itemTitle = selectedItem.title || selectedItem.name;

      // Çift kayıt kontrolü
      const recordsRef = collection(db, "records");
      const q = query(
        recordsRef, 
        where("userId", "==", auth.currentUser.uid),
        where("title", "==", itemTitle)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setAdding(false);
        notify('Uyarı', `"${itemTitle}" zaten listenizde kayıtlı!`, false);
        return;
      }

      // Türleri çevir
      const genreNames = [];
      if (selectedItem.genre_ids && selectedItem.genre_ids.length > 0) {
        // TMDB genre ID → Türkçe isim eşleştirmesi
        const genreMap = {
          28: 'Aksiyon', 12: 'Macera', 16: 'Animasyon', 35: 'Komedi',
          80: 'Gerilim', 99: 'Belgesel', 18: 'Dram', 14: 'Fantastik',
          27: 'Korku', 10402: 'Müzik', 9648: 'Gizem', 10749: 'Romantik',
          878: 'Bilim Kurgu', 10770: 'TV Film', 53: 'Gerilim', 10752: 'Savaş',
          37: 'Western', 10759: 'Aksiyon', 10765: 'Bilim Kurgu', 10768: 'Savaş',
          10762: 'Çocuk', 10763: 'Haber', 10764: 'Gerçeklik', 10766: 'Pembe Dizi',
          10767: 'Talk Show'
        };
        selectedItem.genre_ids.forEach(id => {
          if (genreMap[id]) genreNames.push(genreMap[id]);
        });
      }

      const isShow = addCategory === 'Dizi' || addCategory === 'Kore Dizisi' || addCategory === 'Anime';
      
      await addDoc(collection(db, "records"), {
        userId: auth.currentUser.uid,
        title: itemTitle,
        category: addCategory,
        status: addStatus,
        rating: addRating,
        imageUrl: selectedItem.poster_path ? getImageUrl(selectedItem.poster_path) : '',
        notes: selectedItem.overview || '',
        genres: genreNames,
        genre: genreNames.join(', '),
        isFavorite: false,
        season: isShow ? addSeason : 0,
        episode: isShow ? addEpisode : 0,
        createdAt: new Date().toISOString()
      });

      setAdding(false);
      setModalVisible(false);
      notify('Eklendi!', `"${itemTitle}" listene başarıyla kaydedildi. 🎬`, true);

    } catch (error) {
      setAdding(false);
      console.error("Firestore ekleme hatası:", error);
      notify('Hata', 'Kayıt eklenirken bir hata oluştu.', false);
    }
  };

  const renderStarSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setAddRating(i)} activeOpacity={0.7}>
          <Ionicons
            name={i <= addRating ? 'star' : 'star-outline'}
            size={28}
            color={colors.accent}
            style={{ marginHorizontal: 4 }}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => handleOpenDetail(item)}
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
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const categories = ['Film', 'Dizi', 'Kore Dizisi'];
  const statuses = ['İzledim', 'İzliyorum', 'İzleyeceğim'];

  const statusColors = {
    'İzledim': colors.success,
    'İzliyorum': colors.info,
    'İzleyeceğim': colors.accent
  };

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

      {/* Detay Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Kapatma Butonu */}
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>

              {selectedItem && (
                <>
                  {/* Poster */}
                  <View style={styles.modalPosterContainer}>
                    <Image 
                      source={{ uri: selectedItem.poster_path ? getImageUrl(selectedItem.poster_path) : 'https://via.placeholder.com/300x450' }} 
                      style={styles.modalPoster}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Başlık */}
                  <Text style={styles.modalTitle}>{selectedItem.title || selectedItem.name}</Text>
                  
                  {/* Yıl ve TMDB Puanı */}
                  <View style={styles.modalMetaRow}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaBadgeText}>
                        {(selectedItem.release_date || selectedItem.first_air_date || 'Bilinmiyor').substring(0, 4)}
                      </Text>
                    </View>
                    <View style={[styles.metaBadge, { borderColor: colors.accent }]}>
                      <Ionicons name="star" size={14} color={colors.accent} />
                      <Text style={[styles.metaBadgeText, { color: colors.accent }]}>
                        {selectedItem.vote_average?.toFixed(1)}/10
                      </Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaBadgeText}>
                        {selectedItem.vote_count || 0} oy
                      </Text>
                    </View>
                  </View>

                  {/* Dizi Detayları (Toplam Sezon/Bölüm) */}
                  {selectedItem.total_seasons !== undefined && (
                    <View style={[styles.modalMetaRow, { marginTop: 4 }]}>
                      <View style={[styles.metaBadge, { borderColor: colors.primary }]}>
                        <Ionicons name="tv-outline" size={14} color={colors.primaryLight} />
                        <Text style={[styles.metaBadgeText, { color: colors.primaryLight }]}>
                          {selectedItem.total_seasons} Sezon
                        </Text>
                      </View>
                      <View style={[styles.metaBadge, { borderColor: colors.primary }]}>
                        <Ionicons name="film-outline" size={14} color={colors.primaryLight} />
                        <Text style={[styles.metaBadgeText, { color: colors.primaryLight }]}>
                          {selectedItem.total_episodes} Bölüm
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Özet */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Özet</Text>
                    <Text style={styles.modalOverviewText}>
                      {selectedItem.overview || 'Bu yapım için henüz bir özet bulunmuyor.'}
                    </Text>
                  </View>

                  {/* Ayırıcı */}
                  <View style={styles.modalDivider} />

                  {/* LİSTEYE EKLEME ALANI */}
                  <Text style={styles.addSectionTitle}>📋 Listeme Ekle</Text>

                  {/* Kategori Seçimi */}
                  <View style={styles.modalFieldContainer}>
                    <Text style={styles.modalLabel}>Kategori</Text>
                    <View style={styles.selectorGroup}>
                      {categories.map((cat) => {
                        const isSelected = addCategory === cat;
                        const catColor = colors.categories[cat] || colors.primary;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setAddCategory(cat)}
                            style={[
                              styles.selectorBtn,
                              isSelected && { backgroundColor: catColor + '20', borderColor: catColor }
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.selectorBtnText, isSelected && { color: catColor, fontWeight: 'bold' }]}>
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* İzleme Durumu */}
                  <View style={styles.modalFieldContainer}>
                    <Text style={styles.modalLabel}>İzleme Durumu</Text>
                    <View style={styles.selectorGroup}>
                      {statuses.map((stat) => {
                        const isSelected = addStatus === stat;
                        const statColor = statusColors[stat] || colors.accent;
                        return (
                          <TouchableOpacity
                            key={stat}
                            onPress={() => setAddStatus(stat)}
                            style={[
                              styles.selectorBtn,
                              isSelected && { backgroundColor: statColor + '20', borderColor: statColor }
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.selectorBtnText, isSelected && { color: statColor, fontWeight: 'bold' }]}>
                              {stat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Puan */}
                  <View style={styles.modalFieldContainer}>
                    <Text style={styles.modalLabel}>Kişisel Puanım ({addRating}/5)</Text>
                    {renderStarSelector()}
                  </View>

                  {/* Sezon ve Bölüm (Eğer Dizi/Kore Dizisi/Anime ise) */}
                  {(addCategory === 'Dizi' || addCategory === 'Kore Dizisi' || addCategory === 'Anime') && (
                    <View style={styles.modalFieldContainer}>
                      <Text style={styles.modalLabel}>Sezon ve Bölüm</Text>
                      <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>Sezon</Text>
                          <View style={styles.stepperContainer}>
                            <TouchableOpacity onPress={() => setAddSeason(Math.max(1, addSeason - 1))} style={styles.stepperBtn} activeOpacity={0.7}>
                              <Ionicons name="remove" size={16} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.stepperText}>{addSeason}</Text>
                            <TouchableOpacity onPress={() => setAddSeason(addSeason + 1)} style={styles.stepperBtn} activeOpacity={0.7}>
                              <Ionicons name="add" size={16} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>Bölüm</Text>
                          <View style={styles.stepperContainer}>
                            <TouchableOpacity onPress={() => setAddEpisode(Math.max(1, addEpisode - 1))} style={styles.stepperBtn} activeOpacity={0.7}>
                              <Ionicons name="remove" size={16} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.stepperText}>{addEpisode}</Text>
                            <TouchableOpacity onPress={() => setAddEpisode(addEpisode + 1)} style={styles.stepperBtn} activeOpacity={0.7}>
                              <Ionicons name="add" size={16} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Kaydet Butonu */}
                  <TouchableOpacity 
                    style={[styles.addToListBtn, adding && { opacity: 0.6 }]}
                    onPress={handleAddToList}
                    disabled={adding}
                    activeOpacity={0.8}
                  >
                    {adding ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={22} color="#fff" />
                        <Text style={styles.addToListBtnText}>Kayıt Olarak Ekle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  list: { padding: layout.spacing.md, paddingBottom: 100 },
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
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },

  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalScroll: {
    padding: layout.spacing.md,
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  modalPosterContainer: {
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  modalPoster: {
    width: 180,
    height: 270,
    borderRadius: layout.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...layout.shadows.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: layout.spacing.md,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.glassInput,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: layout.borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: layout.spacing.md,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalOverviewText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: layout.spacing.md,
  },
  addSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: layout.spacing.md,
  },
  modalFieldContainer: {
    marginBottom: layout.spacing.md,
  },
  modalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    paddingLeft: 4,
  },
  selectorGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    minWidth: 80,
    height: 42,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
  },
  selectorBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  addToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: layout.borderRadius.md,
    gap: 8,
    marginTop: layout.spacing.sm,
    ...layout.shadows.md,
  },
  addToListBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperBtn: {
    padding: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: layout.borderRadius.xs,
  },
  stepperText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DiscoverScreen;
