import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import RecordCard from '../components/RecordCard';

const FeedScreen = ({ navigation }) => {
  const currentUserId = auth.currentUser?.uid;
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, [currentUserId]);

  const fetchFeed = async () => {
    if (!currentUserId) return;
    try {
      // 1. Takip edilen kullanıcıların ID'lerini bul
      const followsQuery = query(collection(db, 'follows'), where('followerId', '==', currentUserId));
      const followsSnap = await getDocs(followsQuery);
      const followingIds = [];
      followsSnap.forEach(doc => {
        followingIds.push(doc.data().followingId);
      });

      if (followingIds.length === 0) {
        setFeed([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 2. Bu ID'lerin son eklediği yapımları çek
      // Firestore 'in' sorgusu en fazla 10 eleman kabul eder. Bu nedenle parçalara bölmek gerekebilir. 
      // Şimdilik basitçe ilk 10 takip edileni alıyoruz (Ölçeklenebilirlik için bulut fonksiyonu veya farklı bir yapı gerekir).
      const chunkedIds = followingIds.slice(0, 10); 
      
      const recordsQuery = query(
        collection(db, 'records'), 
        where('userId', 'in', chunkedIds),
      );
      const recordsSnap = await getDocs(recordsQuery);
      
      let list = [];
      
      // Kullanıcı isimlerini almak için önbellek (cache) oluşturalım
      const userCache = {};

      for (const recordDoc of recordsSnap.docs) {
        const data = recordDoc.data();
        
        if (!userCache[data.userId]) {
          const uDoc = await getDoc(doc(db, 'users', data.userId));
          userCache[data.userId] = uDoc.exists() ? uDoc.data().name : 'Biri';
        }

        list.push({
          id: recordDoc.id,
          userName: userCache[data.userId],
          ...data
        });
      }

      // Tarihe göre sırala (En yeni en üstte)
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setFeed(list);
    } catch (error) {
      console.error('Akış getirme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const renderItem = ({ item }) => (
    <View style={styles.feedCard}>
      <TouchableOpacity 
        style={styles.feedHeader}
        onPress={() => navigation.navigate('UserProfile', { userId: item.userId, userName: item.userName })}
      >
        <View style={styles.avatarMini}>
          <Text style={styles.avatarMiniText}>{(item.userName || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.feedUserName}>{item.userName}</Text>
          <Text style={styles.feedActionText}>yeni bir yapım kaydetti</Text>
        </View>
      </TouchableOpacity>
      
      <RecordCard 
        item={item}
        onView={() => navigation.navigate('Detail', { record: item })}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sosyal Akış</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SearchUsers')} style={styles.searchBtn}>
          <Ionicons name="search" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Ionicons name="planet-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Akışın çok sessiz</Text>
              <Text style={styles.emptyText}>Henüz kimseyi takip etmiyorsun veya takip ettiklerin henüz bir şey eklememiş.</Text>
              <TouchableOpacity 
                style={styles.discoverBtn}
                onPress={() => navigation.navigate('SearchUsers')}
              >
                <Text style={styles.discoverBtnText}>Kullanıcıları Keşfet</Text>
              </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchBtn: {
    padding: 4,
  },
  listContent: {
    padding: layout.spacing.md,
    paddingBottom: 40,
  },
  feedCard: {
    marginBottom: 20,
    backgroundColor: colors.surfaceLight + '80',
    borderRadius: layout.borderRadius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryLight,
  },
  feedUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  feedActionText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  discoverBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  discoverBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  }
});

export default FeedScreen;
