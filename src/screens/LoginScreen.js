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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Başarılı girişten sonra AppNavigator otomatik olarak auth state değişimini algılayacak ve bizi yönlendirecek.
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
      let errorMessage = 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'E-posta adresi veya şifre hatalı.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi biçimi.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla hatalı giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.';
      }
      
      notify('Giriş Başarısız', errorMessage, false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient Glows */}
      <View style={styles.glowTop} />
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
            <Text style={styles.title}>Hoş Geldiniz</Text>
            <Text style={styles.subtitle}>Devam etmek için giriş yapın</Text>
          </View>

          <View style={styles.form}>
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
              placeholder="Şifrenizi girin"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({...errors, password: ''});
              }}
              error={errors.password}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            <CustomButton
              title="Giriş Yap"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Kayıt Ol</Text>
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
    marginTop: layout.spacing.md,
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
    right: -100,
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
    left: -100,
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

export default LoginScreen;
