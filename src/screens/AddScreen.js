import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { searchTMDB, getDetailsTMDB, getImageUrl } from '../services/tmdb';

const AddScreen = ({ navigation }) => {
  const [isManualMode, setIsManualMode] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Film'); 
  const [status, setStatus] = useState('İzleyeceğim'); 
  const [rating, setRating] = useState(3); 
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  // TMDB States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const availableGenres = [
    'Aksiyon', 'Komedi', 'Dram', 'Korku', 
    'Bilim Kurgu', 'Romantik', 'Macera', 'Fantastik', 
    'Gerilim', 'Gizem', 'Belgesel', 'Animasyon'
  ];

  const toggleGenre = (g) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter(item => item !== g));
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = ['Film', 'Dizi', 'Anime', 'Kore Dizisi'];
  const statuses = ['İzledim', 'İzliyorum', 'İzleyeceğim'];

  const notify = (title, message, isSuccess = false) => {
    if (Platform.OS === 'web') {
      alert(`${isSuccess ? '✅' : '❌'} ${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // TMDB Arama
  const handleSearchTMDB = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    // Dizileri ve Filmleri aramak için genel olarak 'multi' endpointi de kullanılabilir ama 
    // tmdb.js'deki fonksiyonumuz 'movie' veya 'tv' alıyor.
    // Şimdilik category seçimine göre arayalım
    const type = (category === 'Dizi' || category === 'Kore Dizisi') ? 'tv' : 'movie';
    const results = await searchTMDB(searchQuery, type);
    setSearchResults(results);
    setSearchLoading(false);
  };

  const handleSelectTMDBResult = async (item) => {
    setSearchLoading(true);
    const type = (category === 'Dizi' || category === 'Kore Dizisi') ? 'tv' : 'movie';
    const details = await getDetailsTMDB(item.id, type);
    
    setTitle(details.title || details.name || item.title || item.name || '');
    if (item.poster_path) {
      setImageUrl(getImageUrl(item.poster_path));
    }
    
    // Türleri eşleştir
    if (details.genres && details.genres.length > 0) {
      const tmdbGenres = details.genres.map(g => g.name);
      // Eşleşenleri bul (Çok kaba bir eşleştirme)
      const matched = availableGenres.filter(ag => 
        tmdbGenres.some(tg => tg.toLowerCase().includes(ag.toLowerCase()))
      );
      if (matched.length > 0) setSelectedGenres(matched);
    }

    if (details.overview) {
      setNotes(details.overview);
    }

    setSearchLoading(false);
    setIsManualMode(true); // Verileri doldurduk, şimdi onaylaması için manuel forma geç
  };

  const validate = () => {
    let valid = true;
    let tempErrors = {};

    if (!title.trim()) {
      tempErrors.title = 'Yapım adı girmek zorunludur.';
      valid = false;
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Çift kaydı engellemek için kontrol
      const recordsRef = collection(db, "records");
      const q = query(
        recordsRef, 
        where("userId", "==", auth.currentUser.uid),
        where("title", "==", title.trim())
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setLoading(false);
        notify('Uyarı', `"${title.trim()}" zaten listenizde kayıtlı!`, false);
        return;
      }

      const isShow = category === 'Dizi' || category === 'Anime' || category === 'Kore Dizisi';
      await addDoc(collection(db, "records"), {
        userId: auth.currentUser.uid,
        title: title.trim(),
        category,
        status,
        rating,
        imageUrl: imageUrl.trim(),
        notes: notes.trim(),
        genres: selectedGenres,
        genre: selectedGenres.join(', '),
        isFavorite,
        season: isShow ? Number(season) : 0,
        episode: isShow ? Number(episode) : 0,
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      notify('Kayıt Eklendi', `"${title}" listelerinize başarıyla kaydedildi.`, true);

      // Formu temizle
      setTitle('');
      setCategory('Film');
      setStatus('İzleyeceğim');
      setRating(3);
      setImageUrl('');
      setNotes('');
      setSelectedGenres([]);
      setIsFavorite(false);
      setSeason(1);
      setEpisode(1);
      setSearchQuery('');
      setSearchResults([]);
      setIsManualMode(false);

      navigation.navigate('List');
    } catch (error) {
      setLoading(false);
      console.error("Firestore ekleme hatası:", error);
      notify('Hata', 'Kayıt eklenirken bir hata oluştu.', false);
    }
  };

  const renderStarSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => setRating(i)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={36}
            color={colors.accent}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  // --- TMDB ARAMA EKRANI ---
  const renderTMDBSearch = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder={`${category} Ara (TMDB)...`}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchTMDB}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearchTMDB}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {searchLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tmdbResultCard} onPress={() => handleSelectTMDBResult(item)}>
              <Image 
                source={{ uri: item.poster_path ? getImageUrl(item.poster_path) : 'https://via.placeholder.com/150' }} 
                style={styles.tmdbResultImage}
              />
              <View style={styles.tmdbResultInfo}>
                <Text style={styles.tmdbResultTitle}>{item.title || item.name}</Text>
                <Text style={styles.tmdbResultYear}>
                  {(item.release_date || item.first_air_date || 'Bilinmiyor').substring(0,4)}
                </Text>
                <Text style={styles.tmdbResultDesc} numberOfLines={2}>{item.overview}</Text>
              </View>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Yeni Yapım Ekle</Text>

          {/* TABLAR */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, !isManualMode && styles.tabBtnActive]}
              onPress={() => setIsManualMode(false)}
            >
              <Ionicons name="search" size={18} color={!isManualMode ? colors.primaryLight : colors.textSecondary} />
              <Text style={[styles.tabBtnText, !isManualMode && styles.tabBtnTextActive]}>Otomatik Bul</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, isManualMode && styles.tabBtnActive]}
              onPress={() => setIsManualMode(true)}
            >
              <Ionicons name="pencil" size={18} color={isManualMode ? colors.primaryLight : colors.textSecondary} />
              <Text style={[styles.tabBtnText, isManualMode && styles.tabBtnTextActive]}>Manuel Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
             {/* Kategori Seçimi (Her İki Modda da Geçerli - TMDB Aramasını Etkiler) */}
             <View style={[styles.fieldContainer, { marginBottom: 16 }]}>
              <Text style={styles.label}>Kategori</Text>
              <View style={styles.selectorGroup}>
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  const catColor = colors.categories[cat] || colors.primary;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
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

            {!isManualMode ? renderTMDBSearch() : (
              <View>
                {/* Yapım Adı */}
                <CustomInput
                  label="Yapım Adı *"
                  placeholder="Örn: Inception, Breaking Bad..."
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (errors.title) setErrors({...errors, title: ''});
                  }}
                  error={errors.title}
                  iconName="film-outline"
                />

                {/* Tür Seçimi (Çoklu) */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Tür (Birden fazla seçebilirsiniz)</Text>
                  <View style={styles.genrePillGroup}>
                    {availableGenres.map((g) => {
                      const isSelected = selectedGenres.includes(g);
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => toggleGenre(g)}
                          style={[
                            styles.genrePill,
                            isSelected && styles.genrePillActive
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.genrePillText, isSelected && styles.genrePillTextActive]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* İzleme Durumu Seçimi */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>İzleme Durumu</Text>
                  <View style={styles.selectorGroup}>
                    {statuses.map((stat) => {
                      const isSelected = status === stat;
                      let statColor = colors.accent;
                      if (stat === 'İzledim') statColor = colors.success;
                      if (stat === 'İzliyorum') statColor = colors.info;

                      return (
                        <TouchableOpacity
                          key={stat}
                          onPress={() => setStatus(stat)}
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

                {/* Dizi/Anime İlerleme Durumu */}
                {(category === 'Dizi' || category === 'Anime' || category === 'Kore Dizisi') && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>İlerleme Durumu</Text>
                    <View style={styles.trackerRow}>
                      <View style={styles.trackerItem}>
                        <Text style={styles.trackerSublabel}>Sezon</Text>
                        <View style={styles.trackerControls}>
                          <TouchableOpacity style={styles.trackerBtn} onPress={() => setSeason(Math.max(1, season - 1))}>
                            <Ionicons name="remove" size={16} color={colors.text} />
                          </TouchableOpacity>
                          <Text style={styles.trackerVal}>{season}</Text>
                          <TouchableOpacity style={styles.trackerBtn} onPress={() => setSeason(season + 1)}>
                            <Ionicons name="add" size={16} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.trackerItem}>
                        <Text style={styles.trackerSublabel}>Bölüm</Text>
                        <View style={styles.trackerControls}>
                          <TouchableOpacity style={styles.trackerBtn} onPress={() => setEpisode(Math.max(1, episode - 1))}>
                            <Ionicons name="remove" size={16} color={colors.text} />
                          </TouchableOpacity>
                          <Text style={styles.trackerVal}>{episode}</Text>
                          <TouchableOpacity style={styles.trackerBtn} onPress={() => setEpisode(episode + 1)}>
                            <Ionicons name="add" size={16} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Puan Değerlendirmesi */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Kişisel Puanım ({rating}/5)</Text>
                  {renderStarSelector()}
                </View>

                {/* Görsel URL'si */}
                <CustomInput
                  label="Görsel (Afiş) URL'si"
                  placeholder="https://example.com/poster.jpg"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  iconName="image-outline"
                />

                {/* Görsel Önizleme */}
                {(imageUrl.trim().startsWith('http') || imageUrl.trim().startsWith('data:') || imageUrl.trim().startsWith('file:')) && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewLabel}>Afiş Önizleme</Text>
                     <Image
                      source={{ uri: imageUrl }}
                      style={[styles.previewImage, { shadowColor: colors.primary }]}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Kişisel Not / Yorum */}
                <CustomInput
                  label="Kişisel Not / İnceleme"
                  placeholder="Bu yapım hakkındaki düşünceleriniz, özet vs..."
                  value={notes}
                  onChangeText={setNotes}
                  iconName="chatbubble-ellipses-outline"
                  multiline
                  numberOfLines={4}
                  style={styles.multilineInput}
                />

                {/* Favori Seçeneği */}
                <TouchableOpacity style={styles.favToggleRow} onPress={() => setIsFavorite(!isFavorite)}>
                  <View style={[styles.favCheckbox, isFavorite && styles.favCheckboxChecked]}>
                    {isFavorite && <Ionicons name="star" size={12} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.favToggleLabel}>Favorilerime Ekle</Text>
                    <Text style={styles.favToggleDesc}>Listemin favoriler bölümünde öncelikli listelenecektir.</Text>
                  </View>
                </TouchableOpacity>

                {/* Kaydet Butonu */}
                <CustomButton
                  title="Listeme Ekle"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.saveBtn}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    ...Platform.select({ web: { maxWidth: 720, alignSelf: 'center' } })
  },
  keyboardView: { flex: 1 },
  scrollContent: { padding: layout.spacing.md, paddingBottom: 50 },
  sectionTitle: {
    fontSize: 24, fontWeight: '900', color: colors.text,
    marginBottom: 8, letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: layout.borderRadius.md,
    padding: 4,
    marginBottom: layout.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: layout.borderRadius.sm - 2,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    ...Platform.select({ web: { boxShadow: '0 2px 5px rgba(0,0,0,0.2)' } }),
    elevation: 2,
  },
  tabBtnText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: colors.primaryLight,
  },
  searchBox: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: layout.borderRadius.md,
    borderBottomLeftRadius: layout.borderRadius.md,
    paddingHorizontal: 16,
    color: colors.text,
    height: 48,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: layout.borderRadius.md,
    borderBottomRightRadius: layout.borderRadius.md,
  },
  tmdbResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: layout.borderRadius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tmdbResultImage: {
    width: 50,
    height: 75,
    borderRadius: 4,
    marginRight: 12,
  },
  tmdbResultInfo: {
    flex: 1,
  },
  tmdbResultTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  tmdbResultYear: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  tmdbResultDesc: {
    color: colors.textMuted,
    fontSize: 11,
  },
  form: {
    backgroundColor: colors.glassSurface,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldContainer: { marginVertical: layout.spacing.xs, paddingVertical: 4 },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: layout.spacing.xs, fontWeight: '600', paddingLeft: 4 },
  selectorGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  selectorBtn: {
    flex: 1, minWidth: 80, height: 42, borderRadius: layout.borderRadius.sm,
    borderWidth: 1, borderColor: colors.border, justifyContent: 'center',
    alignItems: 'center', backgroundColor: colors.glassInput,
  },
  selectorBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  starContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: layout.spacing.xs },
  starIcon: { marginHorizontal: 8 },
  previewContainer: { marginVertical: layout.spacing.md, alignItems: 'center' },
  previewLabel: { fontSize: 12, color: colors.textSecondary, alignSelf: 'flex-start', marginBottom: layout.spacing.xs, fontWeight: '600', paddingLeft: 4 },
  previewImage: { width: 110, height: 160, borderRadius: layout.borderRadius.md, borderWidth: 2, borderColor: colors.border },
  multilineInput: { height: 'auto' },
  saveBtn: { marginTop: layout.spacing.lg },
  genrePillGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  genrePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: layout.borderRadius.sm, backgroundColor: colors.glassInput, borderWidth: 1, borderColor: colors.border },
  genrePillActive: { backgroundColor: colors.primary + '18', borderColor: colors.primaryLight },
  genrePillText: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '600' },
  genrePillTextActive: { color: colors.primaryLight, fontWeight: '800' },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  trackerItem: { flex: 1, backgroundColor: colors.glassInput, borderWidth: 1, borderColor: colors.border, borderRadius: layout.borderRadius.sm, padding: 10, alignItems: 'center' },
  trackerSublabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  trackerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  trackerBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  trackerVal: { fontSize: 15, fontWeight: 'bold', color: colors.text, minWidth: 20, textAlign: 'center' },
  favToggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassInput, borderWidth: 1, borderColor: colors.border, borderRadius: layout.borderRadius.sm, padding: 12, marginTop: layout.spacing.sm, gap: 12 },
  favCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.textSecondary, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  favCheckboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  favToggleLabel: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  favToggleDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2 }
});

export default AddScreen;
