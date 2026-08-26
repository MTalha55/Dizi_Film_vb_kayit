import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni alınamadı!');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id-here', // TODO: app.json içindeki projectId buraya yazılmalı
      })).data;
      
      // Token'ı Firestore'a kaydet
      if (auth.currentUser && token) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { pushToken: token }, { merge: true });
      }
    } catch (error) {
      console.log("Token alınırken hata:", error);
    }
  } else {
    console.log('Fiziksel bir cihazda çalışmalısınız (Bildirimler için)');
  }

  return token;
}
