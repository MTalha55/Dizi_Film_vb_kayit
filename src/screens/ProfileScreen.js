import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout, accentThemes, getThemeName, changeTheme } from '../theme/colors';
import CustomButton from '../components/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const PHOTO_KEY = 'user_profile_photo_url';

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [stats, setStats] = useState({
    total: 0,
    Film: 0,
    Dizi: 0,
    Anime: 0,
    'Kore Dizisi': 0,
  });
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [userGender, setUserGender] = useState('Belirtmek İstemiyorum');
  const [topGenres, setTopGenres] = useState([]);

  // Kayıtlı fotoğrafı yükle
  useEffect(() => {
    AsyncStorage.getItem(PHOTO_KEY).then((url) => {
      if (url) setProfilePhoto(url);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'records'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const newStats = { total: 0, Film: 0, Dizi: 0, Anime: 0, 'Kore Dizisi': 0 };
        const genreCounts = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          newStats.total += 1;
          if (data.category && newStats[data.category] !== undefined) {
            newStats[data.category] += 1;
          }

          // Parse genres
          let itemGenres = [];
          if (Array.isArray(data.genres)) {
            itemGenres = data.genres;
          } else if (typeof data.genre === 'string' && data.genre.trim() !== '') {
            itemGenres = data.genre.split(', ').map((g) => g.trim());
          }

          itemGenres.forEach((g) => {
            if (g) {
              genreCounts[g] = (genreCounts[g] || 0) + 1;
            }
          });
        });

        // Sort and select top 3 genres
        const sortedGenres = Object.keys(genreCounts)
          .map((genre) => ({ name: genre, count: genreCounts[genre] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats(newStats);
        setTopGenres(sortedGenres);
        setLoading(false);
      },
      (error) => {
        console.error('Profil istatistikleri okuma hatası:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Kullanıcı bilgilerini (cinsiyet vb.) Firestore'dan çek
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.gender) {
          setUserGender(userData.gender);
        }
      }
    }, (error) => {
      console.error('Kullanıcı bilgisi çekme hatası:', error);
    });

    return unsubscribeUser;
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (Platform.OS === 'web') {
        alert('👋 Çıkış Yapıldı\n\nBaşarıyla oturum kapatıldı.');
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('❌ Hata\n\nÇıkış yapılırken bir hata oluştu.');
      } else {
        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
      }
    }
  };

  // Dosyadan resim seç
  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermelisiniz.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        await AsyncStorage.setItem(PHOTO_KEY, uri);
        setProfilePhoto(uri);
        setPhotoError(false);
        setPhotoModalVisible(false);
      }
    } catch (err) {
      console.error('Resim seçme hatası:', err);
    }
  };

  const handleRemovePhoto = async () => {
    await AsyncStorage.removeItem(PHOTO_KEY);
    setProfilePhoto(null);
    setPhotoError(false);
    setPhotoModalVisible(false);
  };

  const getPercentage = (count) => {
    if (stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  const getJoinedDate = () => {
    if (!user?.metadata?.creationTime) return 'Yeni Katıldı';
    const date = new Date(user.metadata.creationTime);
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Banner ── */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerOverlay} />
          <View style={[styles.bannerGlow, { backgroundColor: colors.primary }]} />
          <Text style={styles.bannerLogoText}>WATCHVAULT</Text>
        </View>

        {/* ── Profil Kartı ── */}
        <View style={[styles.profileHeaderCard, { shadowColor: colors.primary }]}>
          <TouchableOpacity onPress={() => setPhotoModalVisible(true)} activeOpacity={0.8} style={styles.avatarWrapper}>
            <View style={[styles.avatarBorderGlow, { backgroundColor: colors.primary }]} />
            {profilePhoto && !photoError ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.avatarImage}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.displayName || 'Kullanıcı'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          <Text style={styles.userBio}>
            🎬 Sinema, dizi ve anime tutkunu. İzlediğim tüm yapımları ve kişisel incelemelerimi burada arşivliyorum.
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.joinedBadge}>
              <Ionicons name="calendar-outline" size={14} color={colors.primaryLight} style={{ marginRight: 6 }} />
              <Text style={styles.joinedText}>Arşive Katılma: {getJoinedDate()}</Text>
            </View>

            <View style={styles.joinedBadge}>
              <Ionicons
                name={
                  userGender === 'Erkek'
                    ? 'male-outline'
                    : userGender === 'Kadın'
                    ? 'female-outline'
                    : 'remove-circle-outline'
                }
                size={14}
                color={
                  userGender === 'Erkek'
                    ? '#3B82F6'
                    : userGender === 'Kadın'
                    ? '#EC4899'
                    : colors.textSecondary
                }
                style={{ marginRight: 6 }}
              />
              <Text style={styles.joinedText}>Cinsiyet: {userGender}</Text>
            </View>
          </View>
        </View>

        {/* ── Arayüz Teması ── */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>Arayüz Teması</Text>
          <View style={styles.themeCard}>
            <Text style={styles.themeSubtitle}>
              Uygulamanın vurgu rengini değiştirmek için aşağıdaki neon renklerden birini seçin:
            </Text>
            <View style={styles.themeSelectorRow}>
              {Object.keys(accentThemes).map((name) => {
                const themeInfo = accentThemes[name];
                const isSelected = getThemeName() === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.themeOptionBtn,
                      isSelected && { 
                        borderColor: themeInfo.primary, 
                        backgroundColor: themeInfo.primary + '12' 
                      }
                    ]}
                    onPress={() => changeTheme(name)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.themeColorCircle, { backgroundColor: themeInfo.primary }]} />
                    <Text style={[
                      styles.themeOptionText, 
                      isSelected && { color: themeInfo.primary, fontWeight: '800' }
                    ]}>
                      {name === 'purple' ? 'Mor' :
                       name === 'blue' ? 'Mavi' :
                       name === 'green' ? 'Yeşil' :
                       name === 'pink' ? 'Pembe' :
                       name === 'gold' ? 'Altın' : name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── İstatistikler ── */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Arşiv Analitiği</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.totalBox}>
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Toplam Yapım</Text>
                    <Text style={styles.totalValue}>{stats.total}</Text>
                  </View>
                  <View style={[styles.totalIconCircle, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                    <Ionicons name="film-outline" size={28} color={colors.primaryLight} />
                  </View>
                </View>
                <Text style={styles.totalSubtext}>
                  Medya arşivi aktif olarak izleniyor ve senkronize ediliyor.
                </Text>
              </View>

              <View style={styles.distributionContainer}>
                <Text style={styles.distributionTitle}>Arşiv Dağılım Oranı</Text>

                {[
                  { key: 'Film', icon: 'film' },
                  { key: 'Dizi', icon: 'tv' },
                  { key: 'Anime', icon: 'sparkles' },
                  { key: 'Kore Dizisi', icon: 'videocam' },
                ].map(({ key, icon }) => (
                  <View style={styles.progressRow} key={key}>
                    <View style={styles.progressLabelRow}>
                      <View style={styles.progressCategory}>
                        <Ionicons name={icon} size={16} color={colors.categories[key]} style={{ marginRight: 6 }} />
                        <Text style={styles.progressName}>{key}</Text>
                      </View>
                      <Text style={styles.progressVal}>
                        {stats[key]} ({getPercentage(stats[key])}%)
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { backgroundColor: colors.categories[key], width: `${getPercentage(stats[key])}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── İzleme Tercihleri (Tür Analitiği) ── */}
        {!loading && topGenres.length > 0 && (
          <View style={styles.genreAnalyticsSection}>
            <Text style={styles.sectionTitle}>En Çok İzlenen Türler</Text>
            <View style={styles.genreAnalyticsCard}>
              <Text style={styles.genreAnalyticsSubtitle}>
                Arşivinizdeki yapımların tür analizine göre en çok tercih ettiğiniz kategoriler:
              </Text>
              
              {topGenres.map((item, index) => {
                const genrePercent = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                let genreColor = colors.primaryLight;
                if (index === 1) genreColor = colors.secondary;
                if (index === 2) genreColor = colors.accent;

                return (
                  <View key={item.name} style={styles.genreProgressRow}>
                    <View style={styles.genreLabelRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.genreRankCircle, { backgroundColor: genreColor + '20' }]}>
                          <Text style={[styles.genreRankText, { color: genreColor }]}>{index + 1}</Text>
                        </View>
                        <Text style={styles.genreNameText}>{item.name}</Text>
                      </View>
                      <Text style={styles.genrePercentText}>
                        {item.count} Yapım ({genrePercent}%)
                      </Text>
                    </View>
                    <View style={styles.genreProgressBarBg}>
                      <View
                        style={[
                          styles.genreProgressBarFill,
                          { backgroundColor: genreColor, width: `${genrePercent}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Destek ve Talep ── */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Destek ve Talep</Text>

          <TouchableOpacity
            style={styles.supportBtn}
            activeOpacity={0.8}
            onPress={() =>
              Linking.openURL('mailto:mtkirbas@gmail.com').catch(() =>
                Alert.alert('E-posta', 'mtkirbas@gmail.com')
              )
            }
          >
            <View style={[styles.supportIconWrap, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
              <Ionicons name="mail-outline" size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportLabel}>E-posta ile İletişim</Text>
              <Text style={[styles.supportValue, { color: colors.primaryLight }]}>mtkirbas@gmail.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportBtn}
            activeOpacity={0.8}
            onPress={() =>
              Linking.openURL('https://instagram.com/talha_krbs').catch(() =>
                Alert.alert('Instagram', '@talha_krbs')
              )
            }
          >
            <View style={[styles.supportIconWrap, { backgroundColor: colors.secondary + '18', borderColor: colors.secondary + '35' }]}>
              <Ionicons name="logo-instagram" size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportLabel}>Instagram</Text>
              <Text style={[styles.supportValue, { color: colors.secondary }]}>@talha_krbs</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Yönetici Paneli (Sadece Yöneticiye Görünür) ── */}
        {user?.email === 'mtkirbas@gmail.com' && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Sistem Yönetimi</Text>
            <TouchableOpacity
              style={[styles.supportBtn, styles.adminBtn, { borderColor: colors.primary + '50' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Admin')}
            >
              <View style={[styles.supportIconWrap, styles.adminIconWrap, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportLabel}>Yönetici Paneli</Text>
                <Text style={styles.supportValue}>İstatistikler ve Üye Yönetimi</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Oturumu Kapat ── */}
        <CustomButton
          title="Oturumu Kapat"
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={20} color={colors.text} />}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* ── Fotoğraf Modal ── */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { shadowColor: colors.primary }]}>
            {/* Başlık */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil Fotoğrafı</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Mevcut fotoğraf */}
            {profilePhoto && !photoError && (
              <View style={styles.currentPhotoRow}>
                <Image
                  source={{ uri: profilePhoto }}
                  style={[styles.currentPhotoPreview, { borderColor: colors.primary }]}
                  onError={() => setPhotoError(true)}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentPhotoLabel}>Mevcut Fotoğraf</Text>
                  <Text style={styles.currentPhotoSub}>Yeni seçim yaparak değiştirebilirsin</Text>
                </View>
              </View>
            )}

            {/* Dosyadan Seç Butonu */}
            <TouchableOpacity style={styles.pickBtn} activeOpacity={0.8} onPress={handlePickImage}>
              <View style={[styles.pickBtnIcon, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
                <Ionicons name="image-outline" size={32} color={colors.primaryLight} />
              </View>
              <Text style={styles.pickBtnText}>Galeriden Resim Seç</Text>
              <Text style={styles.pickBtnSub}>JPG, PNG veya GIF • Kare kırpma yapılır</Text>
            </TouchableOpacity>

            {/* Kaldır */}
            {profilePhoto && (
              <TouchableOpacity style={styles.removeBtn} onPress={handleRemovePhoto}>
                <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                <Text style={styles.removeBtnText}>Fotoğrafı Kaldır</Text>
              </TouchableOpacity>
            )}
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
    width: '100%',
    ...Platform.select({ web: { maxWidth: 720, alignSelf: 'center' } }),
  },
  scrollContent: { paddingBottom: 50 },
  loadingContainer: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },

  /* Banner */
  bannerContainer: {
    height: 150,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.lg,
    marginHorizontal: layout.spacing.md,
    marginTop: layout.spacing.md,
  },
  bannerOverlay: {
    position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1,
    borderRadius: layout.borderRadius.lg,
  },
  bannerGlow: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: colors.primary, opacity: 0.2,
    ...Platform.select({ web: { filter: 'blur(60px)' } }),
  },
  bannerLogoText: {
    fontSize: 26, fontWeight: '900', color: colors.text,
    letterSpacing: 10, opacity: 0.2, zIndex: 2,
  },

  /* Profil Kartı */
  profileHeaderCard: {
    backgroundColor: colors.glassSurface,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: layout.spacing.md,
    marginHorizontal: layout.spacing.md,
    marginTop: layout.spacing.sm,
    alignItems: 'center',
    ...layout.shadows.md, zIndex: 3,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)' } }),
  },
  avatarWrapper: {
    width: 90, height: 90, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
    marginBottom: layout.spacing.sm,
  },
  avatarBorderGlow: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.primary, opacity: 0.4,
    ...Platform.select({ web: { filter: 'blur(8px)' } }),
  },
  avatarImage: {
    width: 82, height: 82, borderRadius: 41,
    borderWidth: 4, borderColor: colors.surface, zIndex: 2,
  },
  avatarCircle: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: colors.primary, borderWidth: 4,
    borderColor: colors.surface, justifyContent: 'center',
    alignItems: 'center', zIndex: 2, ...layout.shadows.sm,
  },
  avatarText: { fontSize: 34, fontWeight: '900', color: '#FFFFFF' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary, justifyContent: 'center',
    alignItems: 'center', zIndex: 5, borderWidth: 2, borderColor: colors.surface,
  },
  userName: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  userBio: {
    fontSize: 13.5, color: colors.textSecondary, textAlign: 'center',
    marginTop: 12, lineHeight: 19, paddingHorizontal: 15, fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 14,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinedText: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '700' },

  /* İstatistikler */
  statsSection: { padding: layout.spacing.md, marginTop: 4 },
  sectionTitle: {
    fontSize: 19, fontWeight: '900', color: colors.text,
    marginBottom: layout.spacing.md, letterSpacing: 0.5,
  },
  statsGrid: { width: '100%' },
  totalBox: {
    backgroundColor: colors.glassSurface, borderWidth: 1,
    borderColor: colors.border, borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md, marginBottom: layout.spacing.md,
    ...layout.shadows.sm,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)' } }),
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: {
    fontSize: 13, color: colors.textSecondary, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  totalValue: { fontSize: 38, fontWeight: '900', color: colors.text, marginTop: 2 },
  totalIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary + '15', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '30',
  },
  totalSubtext: {
    fontSize: 11.5, color: colors.textMuted, marginTop: 10,
    lineHeight: 16, fontWeight: '500',
  },
  distributionContainer: {
    backgroundColor: colors.glassSurface, borderWidth: 1,
    borderColor: colors.border, borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md, ...layout.shadows.sm,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)' } }),
  },
  distributionTitle: {
    fontSize: 14.5, fontWeight: '800', color: colors.text,
    marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  progressRow: { marginBottom: 14 },
  progressLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  progressCategory: { flexDirection: 'row', alignItems: 'center' },
  progressName: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  progressVal: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: colors.glassInput, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  /* Destek ve Talep */
  supportSection: {
    paddingHorizontal: layout.spacing.md,
    marginTop: 4,
    marginBottom: 4,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.sm,
    gap: 12,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', cursor: 'pointer' } }),
  },
  supportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '18',
    borderWidth: 1,
    borderColor: colors.primary + '35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  supportValue: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '700',
  },

  /* Çıkış */
  logoutBtn: { marginHorizontal: layout.spacing.md, marginTop: 10, borderRadius: layout.borderRadius.lg, width: 'auto' },

  /* Genre Analytics */
  genreAnalyticsSection: {
    paddingHorizontal: layout.spacing.md,
    marginTop: 4,
    marginBottom: 4,
  },
  genreAnalyticsCard: {
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md,
  },
  genreAnalyticsSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  genreProgressRow: {
    marginBottom: 12,
  },
  genreLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  genreRankCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  genreRankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  genreNameText: {
    fontSize: 13.5,
    color: colors.text,
    fontWeight: '700',
  },
  genrePercentText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  genreProgressBarBg: {
    height: 8,
    backgroundColor: colors.glassInput,
    borderRadius: 4,
    overflow: 'hidden',
  },
  genreProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Yönetici Paneli */
  adminSection: {
    paddingHorizontal: layout.spacing.md,
    marginTop: 4,
    marginBottom: 4,
  },
  adminBtn: {
    borderColor: colors.primary + '50',
    backgroundColor: colors.surfaceLight + '30',
  },
  adminIconWrap: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary + '40',
  },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface, borderRadius: layout.borderRadius.lg,
    padding: 22, width: '100%', maxWidth: 400,
    borderWidth: 1, borderColor: colors.border, ...layout.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.glassInput, justifyContent: 'center', alignItems: 'center',
  },
  currentPhotoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.glassInput, borderRadius: layout.borderRadius.md,
    padding: 10, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  currentPhotoPreview: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: colors.primary,
  },
  currentPhotoLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  currentPhotoSub: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },

  /* Dosyadan Seç */
  pickBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: layout.borderRadius.lg,
    paddingVertical: 28, paddingHorizontal: 20, marginBottom: 14,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  pickBtnIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary + '18', justifyContent: 'center',
    alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: colors.primary + '35',
  },
  pickBtnText: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  pickBtnSub: { fontSize: 12, color: colors.textMuted },

  /* Kaldır */
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: layout.borderRadius.md,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.25)',
  },
  removeBtnText: { color: '#ff6b6b', fontWeight: '700', fontSize: 13.5 },

  /* Tema Seçici */
  themeSection: {
    paddingHorizontal: layout.spacing.md,
    marginTop: 4,
    marginBottom: 4,
  },
  themeCard: {
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)' } }),
  },
  themeSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  themeOptionBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: layout.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.glassInput,
    flex: 1,
    minWidth: 55,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.2s ease' } }),
  },
  themeColorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 6,
    ...layout.shadows.sm,
  },
  themeOptionText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default ProfileScreen;
