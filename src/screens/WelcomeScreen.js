import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout } from '../theme/colors';
import CustomButton from '../components/CustomButton';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient Glows */}
      <View style={[styles.glowTop, { backgroundColor: colors.primary }]} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Glow Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoGlow, { backgroundColor: colors.primary }]} />
            <View style={styles.logoGlowOuter} />
            <View style={[styles.logoCircle, { shadowColor: colors.primary }]}>
              <Ionicons name="film" size={54} color={colors.primaryLight} />
            </View>
          </View>

          {/* Başlık ve Slogan */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, Platform.OS === 'web' && { textShadow: `0 0 20px ${colors.primary}30` }]}>
              Watch<Text style={{ color: colors.secondary }}>Vault</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.primaryLight }]}>
              Kişisel Sinematik Arşiviniz
            </Text>
            <Text style={styles.description}>
              İzlediğiniz tüm film, dizi, anime ve Kore dizilerini tek bir yerde toplayın, puanlayın ve arşivinizi dilediğiniz her cihazdan anında yönetin.
            </Text>
          </View>

          {/* Özellik Listesi (Hafif ve Şık) */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <View style={[styles.checkCircle, { borderColor: colors.success }]}>
                <Ionicons name="checkmark" size={14} color={colors.success} />
              </View>
              <Text style={styles.featureText}>Film, Dizi, Anime ve Kore Dizisi kategorileri</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.checkCircle, { borderColor: colors.primaryLight }]}>
                <Ionicons name="checkmark" size={14} color={colors.primaryLight} />
              </View>
              <Text style={styles.featureText}>Detaylı kişisel notlar ve 5 yıldızlı puanlama</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.checkCircle, { borderColor: colors.info }]}>
                <Ionicons name="checkmark" size={14} color={colors.info} />
              </View>
              <Text style={styles.featureText}>Anlık senkronize olan, size özel güvenli veritabanı</Text>
            </View>
          </View>

          {/* Yönlendirme Butonları */}
          <View style={styles.buttonContainer}>
            <CustomButton 
              title="Giriş Yap" 
              variant="primary" 
              onPress={() => navigation.navigate('Login')}
            />
            <CustomButton 
              title="Hesap Oluştur" 
              variant="outline" 
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.native || StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layout.spacing.lg,
    paddingTop: Platform.OS === 'web' ? 70 : 50,
    paddingBottom: Platform.OS === 'web' ? 70 : 30,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    opacity: 0.2,
    ...Platform.select({
      web: {
        filter: 'blur(35px)',
      }
    })
  },
  logoGlowOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.secondary,
    opacity: 0.1,
    ...Platform.select({
      web: {
        filter: 'blur(50px)',
      }
    })
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...layout.shadows.md,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.sm,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1.5,
    ...Platform.select({
      web: {
        textShadow: `0 0 20px ${colors.primary}30`,
      }
    })
  },
  subtitle: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 22,
    maxWidth: 340,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.glassSurface,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: layout.spacing.sm,
    ...layout.shadows.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      }
    })
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 13.5,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 360,
    marginTop: 15,
    gap: 4,
  },
  glowTop: {
    position: 'absolute',
    top: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primary,
    opacity: 0.08,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      }
    })
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.secondary,
    opacity: 0.06,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      }
    })
  }
});

export default WelcomeScreen;
