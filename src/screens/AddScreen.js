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
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const AddScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Film'); // Varsayılan Film
  const [status, setStatus] = useState('İzleyeceğim'); // Varsayılan İzleyeceğim
  const [rating, setRating] = useState(3); // Varsayılan 3 Yıldız
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

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

  // Cross-platform Bildirim Yardımcısı
  const notify = (title, message, isSuccess = false) => {
    if (Platform.OS === 'web') {
      alert(`${isSuccess ? '✅' : '❌'} ${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
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
      // Firestore'a kayıt ekle
      const isShow = category === 'Dizi' || category === 'Anime';
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

      // Listeleme sayfasına geri yönlendir
      navigation.navigate('List');
    } catch (error) {
      setLoading(false);
      console.error("Firestore ekleme hatası:", error);
      notify('Hata', 'Kayıt eklenirken bir hata oluştu.', false);
    }
  };

  // Yıldız Seçme Arayüzünü Çiz
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Yeni Yapım Bilgileri</Text>

          <View style={styles.form}>
            {/* Yapım Adı */}
            <CustomInput
              label="Yapım Adı *"
              placeholder="Örn: Inception, Breaking Bad, Death Note..."
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
                        isSelected && styles.genrePillActive,
                        isSelected && {
                          backgroundColor: colors.primary + '18',
                          borderColor: colors.primaryLight,
                          ...(Platform.OS === 'web' && { boxShadow: `0 0 8px ${colors.primary}20` })
                        }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.genrePillText,
                        isSelected && styles.genrePillTextActive,
                        isSelected && { color: colors.primaryLight }
                      ]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Kategori Seçimi */}
            <View style={styles.fieldContainer}>
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

            {/* Dizi/Anime İlerleme Durumu */}
            {(category === 'Dizi' || category === 'Anime') && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>İlerleme Durumu</Text>
                <View style={styles.trackerRow}>
                  <View style={styles.trackerItem}>
                    <Text style={styles.trackerSublabel}>Sezon</Text>
                    <View style={styles.trackerControls}>
                      <TouchableOpacity
                        style={styles.trackerBtn}
                        onPress={() => setSeason(Math.max(1, season - 1))}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.trackerVal}>{season}</Text>
                      <TouchableOpacity
                        style={styles.trackerBtn}
                        onPress={() => setSeason(season + 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.trackerItem}>
                    <Text style={styles.trackerSublabel}>Bölüm</Text>
                    <View style={styles.trackerControls}>
                      <TouchableOpacity
                        style={styles.trackerBtn}
                        onPress={() => setEpisode(Math.max(1, episode - 1))}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.trackerVal}>{episode}</Text>
                      <TouchableOpacity
                        style={styles.trackerBtn}
                        onPress={() => setEpisode(episode + 1)}
                        activeOpacity={0.7}
                      >
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

            {/* Görsel Önizleme (Varsa) */}
            {imageUrl.trim().startsWith('http') && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Afiş Önizleme</Text>
                 <Image
                  source={{ uri: imageUrl }}
                  style={[styles.previewImage, { shadowColor: colors.primary }]}
                  resizeMode="cover"
                  onError={() => console.log("Görsel yüklenemedi")}
                />
              </View>
            )}

            {/* Kişisel Not / Yorum */}
            <CustomInput
              label="Kişisel Not / İnceleme"
              placeholder="Bu yapım hakkındaki düşünceleriniz, favori karakterleriniz veya hatırlamak istediğiniz detaylar..."
              value={notes}
              onChangeText={setNotes}
              iconName="chatbubble-ellipses-outline"
              multiline
              numberOfLines={4}
              style={styles.multilineInput}
            />

            {/* Favori Seçeneği */}
            <TouchableOpacity
              style={styles.favToggleRow}
              activeOpacity={0.8}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <View style={[styles.favCheckbox, isFavorite && styles.favCheckboxChecked]}>
                {isFavorite && <Ionicons name="star" size={12} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.favToggleLabel}>Bu Yapımı Favorilerime Ekle</Text>
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: layout.spacing.md,
    letterSpacing: 0.5,
  },
  form: {
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
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.xs,
  },
  starIcon: {
    marginHorizontal: 8,
  },
  previewContainer: {
    marginVertical: layout.spacing.md,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: layout.spacing.xs,
    fontWeight: '600',
    paddingLeft: 4,
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
  saveBtn: {
    marginTop: layout.spacing.lg,
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
  },

  /* İlerleme Durumu / Tracker */
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  trackerItem: {
    flex: 1,
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
  },
  trackerSublabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  trackerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  trackerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  trackerVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },

  /* Favori */
  favToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    padding: 12,
    marginTop: layout.spacing.sm,
    gap: 12,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  favCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  favCheckboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  favToggleLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  favToggleDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  }
});

export default AddScreen;
