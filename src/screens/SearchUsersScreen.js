import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';

const SearchUsersScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLatestUsers();
  }, []);

  const fetchLatestUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => {
        if (doc.id !== auth.currentUser?.uid) { // Kendimizi listede göstermeyelim
          list.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(list);
    } catch (error) {
      console.error('Kullanıcıları getirirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      fetchLatestUsers();
      return;
    }

    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const queryLower = text.trim().toLowerCase();
      const list = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        if (doc.id !== auth.currentUser?.uid) {
          const name = (data.name || '').toLowerCase();
          const email = (data.email || '').toLowerCase();
          if (name.includes(queryLower) || email.includes(queryLower)) {
            list.push({ id: doc.id, ...data });
          }
        }
      });
      setUsers(list);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const initials = item.name ? item.name.charAt(0).toUpperCase() : 'U';

    return (
      <TouchableOpacity 
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id, userName: item.name })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'İsimsiz Kullanıcı'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kişileri Keşfet</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim veya E-posta ile ara..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aradığınız kriterde kullanıcı bulunamadı.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    borderRadius: layout.borderRadius.md,
    margin: layout.spacing.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    height: '100%',
    ...Platform.select({ web: { outlineStyle: 'none' } })
  },
  listContent: {
    padding: layout.spacing.md,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryLight,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 15,
  }
});

export default SearchUsersScreen;
