import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  Alert,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Belirtmek İstemiyorum');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

    if (!name.trim()) {
      tempErrors.name = 'Ad alanı zorunludur.';
      valid = false;
    }
    
    if (!email.trim()) {
      tempErrors.email = 'E-posta alanı zorunludur.';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Geçerli bir e-posta adresi girin.';
      valid = false;
    }

    if (!password) {
      tempErrors.password = 'Şifre alanı zorunludur.';
      valid = false;
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (password.length < 6) {
        tempErrors.password = 'Şifre en az 6 karakter olmalıdır.';
        valid = false;
      } else if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        tempErrors.password = 'Şifrede büyük harf, küçük harf, rakam ve en az bir özel karakter (örn: @, !, *, -) bulunmalıdır.';
        valid = false;
      }
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Şifre tekrarı zorunludur.';
      valid = false;
    } else if (confirmPassword !== password) {
      tempErrors.confirmPassword = 'Şifreler eşleşmiyor.';
      valid = false;
    }

    if (!privacyAccepted) {
      tempErrors.privacy = 'Kayıt olmak için gizlilik politikasını onaylamalısınız.';
      valid = false;
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Auth profilde displayName güncelle
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // 3. Firestore'da kullanıcı dökümanı oluştur
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name,
        email: email,
        gender: gender,
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      notify('Kayıt Başarılı', 'Hesabınız başarıyla oluşturuldu. Giriş ekranına yönlendiriliyorsunuz.', true);
      
      // Giriş yap ekranına yönlendir
      navigation.navigate('Login');
    } catch (error) {
      setLoading(false);
      console.error(error);
      let errorMessage = 'Kayıt sırasında bir hata oluştu.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz bir e-posta adresi.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf.';
      }
      
      notify('Kayıt Başarısız', errorMessage, false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient Glows */}
      <View style={[styles.glowTop, { backgroundColor: colors.primary }]} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Custom Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Yeni Hesap Aç</Text>
            <Text style={styles.subtitle}>WatchVault dünyasına katılın</Text>
          </View>

          <View style={[styles.form, { shadowColor: colors.primary }]}>
            <CustomInput
              label="Ad Soyad"
              placeholder="Adınızı girin"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({...errors, name: ''});
              }}
              error={errors.name}
              iconName="person-outline"
            />

            <CustomInput
              label="E-posta"
              placeholder="E-posta adresinizi girin"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({...errors, email: ''});
              }}
              error={errors.email}
              keyboardType="email-address"
              iconName="mail-outline"
            />

            <CustomInput
              label="Şifre"
              placeholder="En az 6 karakter girin"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({...errors, password: ''});
              }}
              error={errors.password}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            <CustomInput
              label="Şifre Tekrarı"
              placeholder="Şifreyi tekrar girin"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
              }}
              error={errors.confirmPassword}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            {/* Cinsiyet Seçimi */}
            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Cinsiyet</Text>
              <View style={styles.genderRow}>
                {[
                  { id: 'Erkek', label: 'Erkek', icon: 'male-outline' },
                  { id: 'Kadın', label: 'Kadın', icon: 'female-outline' },
                  { id: 'Belirtmek İstemiyorum', label: 'Belirtmek İstemiyorum', icon: 'remove-circle-outline' },
                ].map((item) => {
                  const isSelected = gender === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.genderOption,
                        isSelected && styles.genderOptionSelected,
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                        item.id === 'Belirtmek İstemiyorum' && styles.genderOptionFullWidth
                      ]}
                      onPress={() => setGender(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={isSelected ? '#fff' : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.genderOptionText,
                          isSelected && styles.genderOptionTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Gizlilik Politikası Onayı */}
            <TouchableOpacity
              style={[
                styles.privacyRow,
                errors.privacy && styles.privacyRowError,
              ]}
              onPress={() => setPrivacyAccepted(!privacyAccepted)}
              activeOpacity={0.8}
            >
              {/* Checkbox */}
              <View style={[
                styles.checkbox,
                privacyAccepted && styles.checkboxChecked,
                privacyAccepted && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                {privacyAccepted && (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                )}
              </View>

              <Text style={styles.privacyText}>
                {'Okudum ve '}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('PrivacyPolicy', {
                    onAccept: () => {
                      setPrivacyAccepted(true);
                      if (errors.privacy) setErrors({ ...errors, privacy: '' });
                    },
                  })
                }
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={[styles.privacyLink, { color: colors.primaryLight }]}>GİZLİLİK POLİTİKASI</Text>
              </TouchableOpacity>
              <Text style={styles.privacyText}>{'nı onaylıyorum.'}</Text>
            </TouchableOpacity>
            {errors.privacy && (
              <Text style={styles.privacyError}>{errors.privacy}</Text>
            )}

            <CustomButton
              title="Kayıt Ol"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { color: colors.primaryLight }]}>Giriş Yap</Text>
            </TouchableOpacity>
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
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: layout.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: layout.spacing.xs,
    marginBottom: layout.spacing.md,
    marginTop: Platform.OS === 'web' ? 0 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: layout.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    backgroundColor: colors.glassSurface,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      }
    })
  },
  button: {
    marginTop: layout.spacing.sm,
  },

  /* Cinsiyet Seçimi */
  genderContainer: {
    marginTop: layout.spacing.sm,
    width: '100%',
  },
  genderLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
    marginLeft: 4,
    marginBottom: 4,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    minWidth: '45%',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  genderOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderOptionFullWidth: {
    minWidth: '100%',
    marginTop: 2,
  },
  genderOptionText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  genderOptionTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },

  /* Gizlilik Politikası Onayı */
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: layout.spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glassInput,
    gap: 4,
  },
  privacyRowError: {
    borderColor: colors.danger,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  privacyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  privacyLink: {
    fontSize: 13,
    color: colors.primaryLight,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  privacyError: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
    paddingLeft: 4,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: layout.spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14.5,
    fontWeight: '500',
  },
  linkText: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 14.5,
  },
  glowTop: {
    position: 'absolute',
    top: -200,
    left: -100,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: colors.primary,
    opacity: 0.07,
    ...Platform.select({
      web: {
        filter: 'blur(90px)',
      }
    })
  },
  glowBottom: {
    position: 'absolute',
    bottom: -200,
    right: -100,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: colors.secondary,
    opacity: 0.05,
    ...Platform.select({
      web: {
        filter: 'blur(90px)',
      }
    })
  }
});

export default RegisterScreen;
