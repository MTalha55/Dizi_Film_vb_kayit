import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initTheme, registerThemeListener } from './src/theme/colors';
import { registerForPushNotificationsAsync } from './src/services/notifications';

// Web platformu için Google Fonts (Plus Jakarta Sans) enjeksiyonu
if (Platform.OS === 'web') {
  // viewport-fit=cover ekle (mobil safe area desteği)
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover');
  }

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    body, input, select, textarea, button {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    /* Mobil tarayıcılarda alt navigasyon çubuğu için safe area */
    html, body, #root {
      padding-bottom: env(safe-area-inset-bottom, 0px) !important;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    // Uygulama başlangıcında AsyncStorage'dan temayı yükle
    initTheme();

    // Push Notifications başlat (Kullanıcı izin verirse Firestore'a yazar)
    registerForPushNotificationsAsync();

    // Tema değişikliklerini dinle ve ekranı yeniden çizdir
    const unsubscribe = registerThemeListener(() => {
      setThemeVersion((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <AppNavigator key={themeVersion} />
      <StatusBar style="light" />
    </>
  );
}
