import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { colors, layout, accentThemes, getThemeName, changeTheme } from '../theme/colors';

const SettingsScreen = ({ navigation }) => {
  const user = auth.currentUser;

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await signOut(auth);
        if (Platform.OS === 'web') {
          alert('👋 Çıkış Yapıldı\n\nBaşarıyla oturum kapatıldı.');
        }
      } catch {
        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Oturumu kapatmak istediğinizden emin misiniz?')) doLogout();
    } else {
      Alert.alert('Oturumu Kapat', 'Çıkış yapmak istediğinize emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Arayüz Teması ── */}
        <Text style={styles.groupTitle}>GÖRÜNÜM</Text>
        <View style={styles.group}>
          <View style={styles.themeHeader}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Arayüz Teması</Text>
              <Text style={styles.rowSub}>Uygulamanın vurgu rengini seçin</Text>
            </View>
          </View>
          <View style={styles.themePicker}>
            {Object.keys(accentThemes).map((name) => {
              const themeInfo = accentThemes[name];
              const isSelected = getThemeName() === name;
              const label = name === 'purple' ? 'Mor' : name === 'blue' ? 'Mavi' : name === 'green' ? 'Yeşil' : name === 'pink' ? 'Pembe' : name === 'gold' ? 'Altın' : name;
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.themeBtn, isSelected && { borderColor: themeInfo.primary, backgroundColor: themeInfo.primary + '15' }]}
                  onPress={() => changeTheme(name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.themeCircle, { backgroundColor: themeInfo.primary }, isSelected && styles.themeCircleSelected]} />
                  <Text style={[styles.themeLabel, isSelected && { color: themeInfo.primary, fontWeight: '800' }]}>{label}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={14} color={themeInfo.primary} style={{ marginTop: 2 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Destek ── */}
        <Text style={styles.groupTitle}>DESTEK VE İLETİŞİM</Text>
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('mailto:xenonstate.offical@gmail.com').catch(() => Alert.alert('E-posta', 'xenonstate.offical@gmail.com'))}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#3B82F618', borderColor: '#3B82F635' }]}>
              <Ionicons name="mail-outline" size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>E-posta ile Destek</Text>
              <Text style={[styles.rowSub, { color: '#3B82F6' }]}>xenonstate.offical@gmail.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://instagram.com/the_xenonstate').catch(() => Alert.alert('Instagram', '@the_xenonstate'))}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#E1306C18', borderColor: '#E1306C35' }]}>
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Instagram</Text>
              <Text style={[styles.rowSub, { color: '#E1306C' }]}>@the_xenonstate</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '35' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Admin ile Mesajlaş</Text>
              <Text style={styles.rowSub}>Soru, öneri veya şikayetleriniz için</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Yönetici (sadece admin) ── */}
        {user?.email?.toLowerCase() === 'mtkirbas@gmail.com' && (
          <>
            <Text style={styles.groupTitle}>YÖNETİCİ</Text>
            <View style={styles.group}>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Admin')}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Yönetici Paneli</Text>
                  <Text style={styles.rowSub}>İstatistikler ve Üye Yönetimi</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Hesap ── */}
        <Text style={styles.groupTitle}>HESAP</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleLogout}>
            <View style={[styles.iconWrap, { backgroundColor: '#EF444418', borderColor: '#EF444435' }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Oturumu Kapat</Text>
              <Text style={styles.rowSub}>Hesabından güvenli çıkış yap</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>WatchVault v1.0.0</Text>
          <Text style={styles.footerText}>© 2026 Tüm hakları saklıdır.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({ web: { maxWidth: 680, alignSelf: 'center', width: '100%' } }),
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassInput,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingVertical: layout.spacing.md,
    paddingBottom: 100,
  },

  /* Group */
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginHorizontal: layout.spacing.md,
    marginTop: layout.spacing.md,
    marginBottom: 6,
  },
  group: {
    marginHorizontal: layout.spacing.md,
    backgroundColor: colors.glassSurface,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...layout.shadows.sm,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)' } }),
  },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
    gap: 12,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16 + 42 + 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  /* Tema Seçici */
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
    gap: 12,
  },
  themePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.md,
  },
  themeBtn: {
    flex: 1,
    minWidth: 55,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: layout.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.glassInput,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.2s ease' } }),
  },
  themeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginBottom: 5,
    ...layout.shadows.sm,
  },
  themeCircleSelected: {
    ...Platform.select({ web: { boxShadow: '0 0 10px currentColor' } }),
  },
  themeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default SettingsScreen;
