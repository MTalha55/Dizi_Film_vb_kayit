import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAHOvvLQj0PSX-TzWjbFE6CeBWl8uFmKsM",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "diziarsiv-3de89.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "diziarsiv-3de89",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "diziarsiv-3de89.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1017270848506",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1017270848506:android:3f10b984f687a9f4de7243",
};

// Firebase uygulamasını ilklendir
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth ve kalıcılık (persistence) ayarları
let auth;
try {
  // Eğer daha önce ilklendirilmişse mevcut instance'ı al (Hot Reload çökmelerini önler)
  auth = getAuth(app);
} catch (e) {
  if (Platform.OS === 'web') {
    // Web üzerinde localStorage kullanarak kalıcılık sağlıyoruz (sayfa yenilendiğinde çıkış yapmaz)
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
  } else {
    // Mobil üzerinde AsyncStorage kullanarak kalıcılık sağlıyoruz
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

// Firestore veritabanı bağlantısı
const db = getFirestore(app);

export { app, auth, db };
