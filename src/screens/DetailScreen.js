import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const DetailScreen = ({ route, navigation }) => {
  const { id, editMode = false } = route.params;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(editMode);
  const [saving, setSaving] = useState(false);

  // Düzenleme form alanları
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState(3);
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [error, setError] = useState('');

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

  const categories = ['Film', 'Dizi', 'Anime', 'Kore Dizisi'];
  const statuses = ['İzledim', 'İzliyorum', 'İzleyeceğim'];

  // Cross-platform Bildirim Yardımcısı
  const notify = (title, message, isSuccess = false) => {
    if (Platform.OS === 'web') {
      alert(`${isSuccess ? '✅' : '❌'} ${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    const docRef = doc(db, "records", id);
    
    // Gerçek zamanlı döküman dinleyicisi
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecord(data);
        
        // Form alanlarını doldur
        setTitle(data.title);
        setCategory(data.category);
        setStatus(data.status);
        setRating(data.rating);
        setImageUrl(data.imageUrl || '');
        setNotes(data.notes || '');
        if (Array.isArray(data.genres)) {
          setSelectedGenres(data.genres);
        } else if (typeof data.genre === 'string') {
          setSelectedGenres(data.genre.split(', ').filter(g => g.trim() !== ''));
        } else {
          setSelectedGenres([]);
        }
      } else {
        // Eğer döküman silindiyse listeye geri dön
        navigation.goBack();
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore detay okuma hatası:", err);
      setLoading(false);
      notify('Hata', 'Detay bilgisi yüklenirken bir hata oluştu.', false);
    });

    return unsubscribe;
  }, [id]);

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError('Yapım adı alanı zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "records", id);
      await updateDoc(docRef, {
        title: title.trim(),
        category,
        status,
        rating,
        imageUrl: imageUrl.trim(),
        notes: notes.trim(),
        genres: selectedGenres,
        genre: selectedGenres.join(', '),
        updatedAt: new Date().toISOString()
      });
      setSaving(false);
      setIsEditing(false);
      notify('Güncellendi', 'Bilgiler başarıyla güncellendi.', true);
    } catch (err) {
      console.error("Firestore güncelleme hatası:", err);
      setSaving(false);
      notify('Hata', 'Güncelleme sırasında bir hata oluştu.', false);
    }
  };

  const handleDelete = () => {
    const performDelete = async () => {
      try {
        await deleteDoc(doc(db, "records", id));
        if (Platform.OS === 'web') {
          alert('🗑️ Silindi\n\nKayıt başarıyla silindi.');
        }
        navigation.goBack();
      } catch (err) {
        console.error("Firestore silme hatası:", err);
        notify('Hata', 'Kayıt silinirken bir hata oluştu.', false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`"${record?.title}" kaydını silmek istediğinize emin misiniz?`);
      if (confirmDelete) performDelete();
    } else {
      Alert.alert(
        'Kaydı Sil',
        `"${record?.title}" kaydını silmek istediğinize emin misiniz?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Sil', onPress: performDelete, style: 'destructive' }
        ]
      );
    }
  };

  // Kategori Rengi Belirle
  const getCategoryColor = (cat) => {
    return colors.categories[cat] || colors.categories.Varsayilan;
  };

  const statusColors = {
    'İzledim': colors.success,
    'İzliyorum': colors.info,
    'İzleyeceğim': colors.accent
  };

  // Yıldız çizim yardımcıları
  const renderStars = (count) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= count ? 'star' : 'star-outline'}
          size={20}
          color={colors.accent}
          style={{ marginRight: 4 }}
        />
      );
    }
    return <View style={styles.starRow}>{stars}</View>;
  };

  // Düzenleme yıldız seçimi
  const renderStarSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={32}
            color={colors.accent}
            style={{ marginHorizontal: 4 }}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starSelectorContainer}>{stars}</View>;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Kayıt bulunamadı veya silinmiş.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Custom Header */}
          <View style={styles.customHeader}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>
              {isEditing ? 'Yapımı Düzenle' : 'Yapım Detayları'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {isEditing ? (
            /* DÜZENLEME MODU */
            <View style={styles.formContainer}>
              <Text style={styles.editTitle}>Yapımı Düzenle</Text>
              
              <CustomInput
                label="Yapım Adı *"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (error) setError('');
                }}
                error={error}
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
                      >
                        <Text style={[
                          styles.genrePillText,
                          isSelected && styles.genrePillTextActive
                        ]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Kategori */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Kategori</Text>
                <View style={styles.selectorGroup}>
                  {categories.map((cat) => {
                    const isSelected = category === cat;
                    const catColor = getCategoryColor(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.selectorBtn,
                          isSelected && { backgroundColor: catColor + '20', borderColor: catColor }
                        ]}
                      >
                        <Text style={[
                          styles.selectorBtnText,
                          isSelected && { color: catColor, fontWeight: 'bold' }
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* İzleme Durumu */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>İzleme Durumu</Text>
                <View style={styles.selectorGroup}>
                  {statuses.map((stat) => {
                    const isSelected = status === stat;
                    const statColor = statusColors[stat] || colors.accent;
                    return (
                      <TouchableOpacity
                        key={stat}
                        onPress={() => setStatus(stat)}
                        style={[
                          styles.selectorBtn,
                          isSelected && { backgroundColor: statColor + '20', borderColor: statColor }
                        ]}
                      >
                        <Text style={[
                          styles.selectorBtnText,
                          isSelected && { color: statColor, fontWeight: 'bold' }
                        ]}>
                          {stat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Puan */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Kişisel Puanım ({rating}/5)</Text>
                {renderStarSelector()}
              </View>

              {/* Görsel URL */}
              <CustomInput
                label="Görsel (Afiş) URL'si"
                value={imageUrl}
                onChangeText={setImageUrl}
                iconName="image-outline"
              />

              {imageUrl.trim().startsWith('http') && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                </View>
              )}

              {/* Notlar */}
              <CustomInput
                label="Kişisel Not / İnceleme"
                value={notes}
                onChangeText={setNotes}
                iconName="chatbubble-ellipses-outline"
                multiline
                numberOfLines={4}
                style={styles.multilineInput}
              />

              {/* Kaydet ve İptal Butonları */}
              <View style={styles.buttonRow}>
                <CustomButton
                  title="Değişiklikleri Kaydet"
                  onPress={handleUpdate}
                  loading={saving}
                  style={styles.saveBtn}
                />
                <CustomButton
                  title="Vazgeç"
                  variant="outline"
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelBtn}
                />
              </View>
            </View>
          ) : (
            /* GÖRÜNTÜLEME MODU */
            <View style={styles.detailsContainer}>
              {/* Afiş Alanı */}
              <View style={styles.bannerContainer}>
                {record.imageUrl && record.imageUrl.trim().startsWith('http') ? (
                  <Image source={{ uri: record.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.bannerPlaceholder, { backgroundColor: getCategoryColor(record.category) + '15' }]}>
                    <Ionicons 
                      name={
                        record.category === 'Film' ? 'film' : 
                        record.category === 'Dizi' ? 'tv' : 
                        record.category === 'Anime' ? 'sparkles' : 'videocam'
                      } 
                      size={80} 
                      color={getCategoryColor(record.category)} 
                    />
                  </View>
                )}
              </View>

              {/* Yapım Detay Kartı */}
              <View style={styles.infoCard}>
                <View style={styles.badgeRow}>
                  {/* Kategori */}
                  <View style={[styles.badge, { backgroundColor: getCategoryColor(record.category) + '20', borderColor: getCategoryColor(record.category) }]}>
                    <Text style={[styles.badgeText, { color: getCategoryColor(record.category) }]}>
                      {record.category}
                    </Text>
                  </View>

                  {/* İzleme Durumu */}
                  <View style={[styles.badge, { backgroundColor: (statusColors[record.status] || colors.accent) + '20', borderColor: statusColors[record.status] || colors.accent }]}>
                    <Text style={[styles.badgeText, { color: statusColors[record.status] || colors.accent }]}>
                      {record.status}
                    </Text>
                  </View>
                </View>

                {/* Yapım Adı */}
                <Text style={styles.detailTitle}>{record.title}</Text>

                {/* Yıldız Değerlendirmesi */}
                <View style={styles.ratingSection}>
                  <Text style={styles.sectionLabel}>Değerlendirme:</Text>
                  {renderStars(record.rating)}
                </View>

                {/* Tür Bilgisi */}
                {selectedGenres.length > 0 && (
                  <View style={styles.genreSection}>
                    <Text style={styles.sectionLabel}>Tür:</Text>
                    <Text style={styles.genreValueText}>{selectedGenres.join(', ')}</Text>
                  </View>
                )}

                <View style={styles.divider} />

                {/* Kişisel Notlar */}
                <Text style={styles.sectionLabel}>Kişisel Not & İnceleme:</Text>
                <Text style={styles.notesText}>
                  {record.notes && record.notes.trim() !== '' 
                    ? record.notes 
                    : 'Henüz kişisel bir inceleme veya not eklenmemiş.'}
                </Text>

                <View style={styles.divider} />
                
                {/* Tarih Bilgisi */}
                <Text style={styles.dateText}>
                  Ekleme Tarihi: {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>

              {/* Butonlar */}
              <View style={styles.actionButtonContainer}>
                <CustomButton
                  title="Düzenle"
                  variant="primary"
                  icon={<Ionicons name="create-outline" size={20} color="#FFFFFF" />}
                  onPress={() => setIsEditing(true)}
                />
                
                <CustomButton
                  title="Kayıt Sil"
                  variant="danger"
                  icon={<Ionicons name="trash-outline" size={20} color="#FFFFFF" />}
                  onPress={handleDelete}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.native || StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 720,
        alignSelf: 'center',
      }
    })
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.md,
    paddingBottom: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginTop: 100,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: colors.glassSurface,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      }
    })
  },
  editTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: layout.spacing.md,
  },
  fieldContainer: {
    marginVertical: layout.spacing.xs,
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: layout.spacing.xs,
    fontWeight: '600',
    paddingLeft: 4,
    letterSpacing: 0.5,
  },
  selectorGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
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
    ...Platform.select({
      web: {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    })
  },
  selectorBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  starSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.xs,
  },
  previewContainer: {
    marginVertical: layout.spacing.md,
    alignItems: 'center',
  },
  previewImage: {
    width: 110,
    height: 160,
    borderRadius: layout.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...layout.shadows.md,
  },
  multilineInput: {
    height: 'auto',
  },
  buttonRow: {
    flexDirection: 'column',
    marginTop: layout.spacing.lg,
    gap: 4,
  },
  saveBtn: {
    marginBottom: layout.spacing.xs,
  },
  cancelBtn: {
    //
  },
  
  /* Görüntüleme Modu Stilleri */
  detailsContainer: {
    alignItems: 'center',
  },
  bannerContainer: {
    width: '100%',
    maxWidth: 220,
    height: 310,
    borderRadius: layout.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: layout.spacing.md,
    ...layout.shadows.lg,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.glassSurface,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
    ...layout.shadows.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      }
    })
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: layout.spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginVertical: layout.spacing.xs,
    lineHeight: 34,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: layout.spacing.sm,
  },
  starRow: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: layout.spacing.md,
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    fontWeight: '600',
  },
  actionButtonContainer: {
    width: '100%',
    gap: 6,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.md,
    marginTop: Platform.OS === 'web' ? 0 : 10,
    width: '100%',
  },
  backBtn: {
    padding: layout.spacing.xs,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.5,
  },
  genreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: layout.spacing.xs,
  },
  genreValueText: {
    fontSize: 14.5,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '600',
  },
  genrePillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  genrePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: layout.borderRadius.sm,
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      }
    })
  },
  genrePillActive: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primaryLight,
    ...Platform.select({
      web: {
        boxShadow: `0 0 8px ${colors.primary}20`,
      }
    })
  },
  genrePillText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  genrePillTextActive: {
    color: colors.primaryLight,
    fontWeight: '800',
  }
});

export default DetailScreen;
