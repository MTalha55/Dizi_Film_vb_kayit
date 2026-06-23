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
                        isSelected && styles.genrePillActive
                      ]}
                      activeOpacity={0.7}
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
                  style={styles.previewImage}
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
  }
});

export default AddScreen;
