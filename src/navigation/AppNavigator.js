import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';

// Ekranlar
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ListScreen from '../screens/ListScreen';
import AddScreen from '../screens/AddScreen';
import DetailScreen from '../screens/DetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import AdminScreen from '../screens/AdminScreen';
import ChatScreen from '../screens/ChatScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchUsersScreen from '../screens/SearchUsersScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import DiscoverScreen from '../screens/DiscoverScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Uygulama Navigasyon Teması (Varsayılan DarkTheme özelliklerini miras alıyoruz)
const MyTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.secondary,
  },
};

// Kimlik Doğrulama Ekranları Stack'i
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
  </Stack.Navigator>
);

// Ana Uygulama Sekmeleri (List, Add, Profile)
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'List') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'Add') {
          iconName = focused ? 'add-circle' : 'add-circle-outline';
        } else if (route.name === 'Discover') {
          iconName = focused ? 'bulb' : 'bulb-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primaryLight,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        ...Platform.select({
          web: {
            backgroundColor: 'rgba(18, 18, 26, 0.85)',
            backdropFilter: 'blur(20px)',
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          default: {
            backgroundColor: colors.surface,
            height: 80,
            paddingBottom: 20,
            paddingTop: 8,
          },
        }),
        borderTopColor: colors.border,
      },
      headerStyle: {
        ...Platform.select({
          web: { backgroundColor: 'rgba(18, 18, 26, 0.85)' },
          default: { backgroundColor: colors.surface },
        }),
        shadowColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerShown: false,
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
      }
    })}
  >
    <Tab.Screen 
      name="List" 
      component={ListScreen} 
      options={{ title: 'İzleme Listesi' }}
    />
    <Tab.Screen 
      name="Add" 
      component={AddScreen} 
      options={{ title: 'Kayıt Ekle' }}
    />
    <Tab.Screen 
      name="Discover" 
      component={DiscoverScreen} 
      options={{ title: 'Keşfet' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Profilim' }}
    />
  </Tab.Navigator>
);

// Ana Stack (Sekmeler + Detay Ekranı)
const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // Web platformunda çökmeyi önlemek için yerel başlıkları kapatıyoruz
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabNavigator} 
    />
    <Stack.Screen 
      name="Detail" 
      component={DetailScreen} 
    />
    <Stack.Screen 
      name="Admin" 
      component={AdminScreen} 
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen} 
    />
    <Stack.Screen 
      name="SearchUsers" 
      component={SearchUsersScreen} 
    />
    <Stack.Screen 
      name="UserProfile" 
      component={UserProfileScreen} 
    />
  </Stack.Navigator>
);

// Ana Yönlendirici
const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);

      // Eski dinleyiciyi temizle
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser && currentUser.email) {
        const q = query(collection(db, 'blacklisted_emails'), where('email', '==', currentUser.email.toLowerCase()));
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            signOut(auth);
            if (Platform.OS === 'web') {
              alert('Hesabınız yönetici tarafından engellendi. Oturumunuz kapatıldı.');
            } else {
              // React Native'de Alert importu gerekebilir, ama yukarıda View, vs var, Alert'i de eklemeliyiz
              Alert.alert('Engellendi', 'Hesabınız yönetici tarafından engellendi. Oturumunuz kapatıldı.');
            }
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
