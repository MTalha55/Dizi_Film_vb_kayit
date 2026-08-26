import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import RecordCard from '../components/RecordCard';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const currentUserId = auth.currentUser?.uid;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Records
      const q = query(collection(db, 'records'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setRecords(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      // 2. Check Following Status
      const followId = `${currentUserId}_${userId}`;
      const followRef = doc(db, 'follows', followId);
      const followSnap = await getDoc(followRef);
      setIsFollowing(followSnap.exists());

      // 3. Fetch Follow Counts (Simple query for now)
      const followersQuery = query(collection(db, 'follows'), where('followingId', '==', userId));
      const followersSnap = await getDocs(followersQuery);
      setFollowerCount(followersSnap.size);

      const followingQuery = query(collection(db, 'follows'), where('followerId', '==', userId));
      const followingSnap = await getDocs(followingQuery);
      setFollowingCount(followingSnap.size);

    } catch (error) {
      console.error('Kullanıcı verisi çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    const followId = `${currentUserId}_${userId}`;
    const followRef = doc(db, 'follows', followId);
    
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await setDoc(followRef, {
          followerId: currentUserId,
          followingId: userId,
          createdAt: new Date().toISOString()
        });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Takip işlemi hatası:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(userName || 'U').charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.userName}>{userName}</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{records.length}</Text>
          <Text style={styles.statLabel}>Yapım</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{followerCount}</Text>
          <Text style={styles.statLabel}>Takipçi</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{followingCount}</Text>
          <Text style={styles.statLabel}>Takip</Text>
        </View>
      </View>

      {currentUserId !== userId && (
        <TouchableOpacity 
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={handleToggleFollow}
          activeOpacity={0.8}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Takipten Çık' : 'Takip Et'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Son Ekledikleri</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginHorizontal: layout.spacing.md, marginBottom: 10 }}>
               {/* Sadece okuma amaçlı (onEdit, onDelete boş) */}
               <RecordCard 
                 item={item} 
                 onView={() => navigation.navigate('Detail', { record: item })}
                 onEdit={() => {}}
                 onDelete={() => {}}
               />
            </View>
          )}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Ionicons name="film-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Henüz hiç yapım eklememiş.</Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: layout.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: layout.spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primaryLight,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 20,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  followingBtnText: {
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
    alignSelf: 'flex-start',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerEmpty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 15,
  }
});

export default UserProfileScreen;
