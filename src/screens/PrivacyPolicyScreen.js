import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout } from '../theme/colors';

const Section = ({ icon, title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBg}>
        <Ionicons name={icon} size={16} color={colors.primaryLight} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionBody}>{children}</Text>
  </View>
);

const PrivacyPolicyScreen = ({ navigation, route }) => {
  // route.params?.onAccept callback'i RegisterScreen'den geliyor
  const onAccept = route?.params?.onAccept;

  const openMail = () => {
    Linking.openURL('mailto:mtkirbas@gmail.com').catch(() => {
      if (Platform.OS === 'web') {
        alert('E-posta adresi: mtkirbas@gmail.com');
      } else {
        Alert.alert('E-posta', 'mtkirbas@gmail.com');
      }
    });
  };

  const openInstagram = () => {
    Linking.openURL('https://instagram.com/talha_krbs').catch(() => {
      if (Platform.OS === 'web') {
        alert('Instagram: @talha_krbs');
      } else {
        Alert.alert('Instagram', '@talha_krbs');
      }
    });
  };

  const handleAccept = () => {
    if (onAccept) onAccept(); // RegisterScreen'deki checkbox'ı işaretle
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Arka plan glowları */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Başlık */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primaryLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
          <Text style={styles.headerSub}>WatchVault — Son güncelleme: Haziran 2025</Text>
        </View>
      </View>

      {/* İçerik */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Uygulama Kimliği */}
        <View style={styles.appBadge}>
          <Ionicons name="film" size={18} color={colors.primaryLight} style={{ marginRight: 8 }} />
          <Text style={styles.appBadgeText}>WatchVault — Kişisel Sinematik Arşiv</Text>
        </View>

        <Section icon="information-circle-outline" title="Genel Bilgi">
          WatchVault uygulaması, kullanıcıların izledikleri film, dizi, anime ve Kore dizilerini kişisel olarak arşivlemelerine olanak tanır. Bu gizlilik politikası, uygulamamızın hangi verileri topladığını, nasıl kullandığını ve nasıl koruduğunu açıklar.
        </Section>

        <Section icon="person-outline" title="Toplanan Kişisel Veriler">
          Uygulamaya kayıt olurken e-posta adresiniz ve oluşturduğunuz şifre sistemimize kaydedilir. Bu veriler yalnızca kimlik doğrulama amacıyla kullanılır ve Firebase Authentication altyapısı ile güvenli biçimde saklanır.{'\n\n'}
          Uygulamaya eklediğiniz içerik kayıtları (film/dizi adı, puan, notlar vb.) Firebase Firestore veritabanına, yalnızca size ait bir kimlik (kullanıcı ID) ile eşleştirilmiş olarak saklanır. Bu veriler başka kullanıcılarla paylaşılmaz.
        </Section>

        <Section icon="server-outline" title="Veri Depolama ve Güvenlik">
          Tüm verileriniz Google Firebase altyapısı üzerinde, şifreli bağlantılar (HTTPS/TLS) aracılığıyla iletilir ve depolanır. Profil fotoğrafınız yalnızca cihazınızda yerel olarak (AsyncStorage) saklanır; sunucularımıza yüklenmez.{'\n\n'}
          Verileriniz üçüncü taraf reklam şirketleri ile paylaşılmaz; yalnızca uygulamanın işlevselliği için kullanılır.
        </Section>

        <Section icon="analytics-outline" title="Kullanım Verisi">
          Uygulama, kilitlenme raporları ve performans metrikleri dışında herhangi bir davranışsal analitik verisi toplamaz. Uygulamada üçüncü taraf reklam kütüphanesi bulunmamaktadır.
        </Section>

        <Section icon="trash-outline" title="Veri Silme Hakkı">
          Hesabınızı ve tüm verilerinizi kalıcı olarak silmek için geliştirici ile iletişime geçebilirsiniz. Hesap silme talebi en geç 30 iş günü içinde işleme alınır.
        </Section>

        <Section icon="lock-closed-outline" title="Çerezler ve Yerel Depolama">
          WatchVault; kullanıcı oturumunu sürdürmek ve profil fotoğrafı URL'sini saklamak amacıyla cihazınızdaki yerel depolama alanını (AsyncStorage) kullanır. Bu veriler hiçbir şekilde reklam amacıyla kullanılmaz.
        </Section>

        <Section icon="refresh-outline" title="Politika Güncellemeleri">
          Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler yapıldığında uygulama aracılığıyla bildirim alırsınız.
        </Section>

        {/* Telif & İletişim */}
        <View style={styles.copyrightCard}>
          <View style={styles.copyrightHeader}>
            <Ionicons name="ribbon-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={styles.copyrightTitle}>Telif Hakkı</Text>
          </View>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} WatchVault. Tüm hakları saklıdır.{'\n'}
            Bu uygulamanın tüm fikri mülkiyet hakları{' '}
            <Text style={styles.ownerName}>Muhammed Talha Kırbaş</Text>'a aittir.
            İzinsiz kopyalanması, dağıtılması veya değiştirilmesi yasaktır.
          </Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={openMail} activeOpacity={0.8}>
              <Ionicons name="mail-outline" size={15} color={colors.primaryLight} />
              <Text style={styles.contactBtnText}>mtkirbas@gmail.com</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn} onPress={openInstagram} activeOpacity={0.8}>
              <Ionicons name="logo-instagram" size={15} color={colors.secondary} />
              <Text style={[styles.contactBtnText, { color: colors.secondary }]}>@talha_krbs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Onay Butonu */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.acceptBtnText}>Anladım, Onaylıyorum</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({ web: { maxWidth: 720, alignSelf: 'center', width: '100%' } }),
  },
  glowTop: {
    position: 'absolute', top: -120, left: -100,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: colors.primary, opacity: 0.07,
    ...Platform.select({ web: { filter: 'blur(90px)' } }),
  },
  glowBottom: {
    position: 'absolute', bottom: -120, right: -100,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: colors.secondary, opacity: 0.05,
    ...Platform.select({ web: { filter: 'blur(90px)' } }),
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingTop: Platform.OS === 'web' ? layout.spacing.lg : layout.spacing.md,
    paddingBottom: layout.spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.glassInput,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: layout.spacing.md },

  appBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary + '12',
    borderWidth: 1, borderColor: colors.primary + '30',
    borderRadius: layout.borderRadius.sm,
    paddingVertical: 9, paddingHorizontal: 12,
    marginBottom: 14,
  },
  appBadgeText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryLight },

  section: {
    backgroundColor: colors.glassSurface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)' } }),
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIconBg: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: colors.primary + '18',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10, borderWidth: 1, borderColor: colors.primary + '30',
  },
  sectionTitle: { fontSize: 13.5, fontWeight: '800', color: colors.text, flex: 1 },
  sectionBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  copyrightCard: {
    backgroundColor: colors.accent + '0D',
    borderWidth: 1, borderColor: colors.accent + '30',
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.sm,
  },
  copyrightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  copyrightTitle: { fontSize: 14, fontWeight: '800', color: colors.accent },
  copyrightText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  ownerName: { color: colors.text, fontWeight: '800' },
  contactRow: { marginTop: 12, gap: 8 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.glassInput,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    paddingVertical: 9, paddingHorizontal: 12, gap: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  contactBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryLight },

  footer: {
    padding: layout.spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius.md,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    ...layout.shadows.md,
  },
  acceptBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default PrivacyPolicyScreen;
