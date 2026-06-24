import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { colors, layout } from '../theme/colors';

const AdminScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy] = useState('activity');
  const [genderFilter, setGenderFilter] = useState('Hepsi');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecords: 0,
    averageRecords: 0,
    categoryBreakdown: {
      Film: 0,
      Dizi: 0,
      Anime: 0,
      'Kore Dizisi': 0,
    },
  });

  const fetchData = async () => {
    try {
      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = [];
      usersSnap.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });

      // Fetch records
      const recordsSnap = await getDocs(collection(db, 'records'));
      const recordsList = [];
      recordsSnap.forEach((doc) => {
        recordsList.push({ id: doc.id, ...doc.data() });
      });

      // Calculate counts per user
      const counts = {};
      const breakdown = { Film: 0, Dizi: 0, Anime: 0, 'Kore Dizisi': 0 };

      recordsList.forEach((rec) => {
        if (rec.userId) {
          counts[rec.userId] = (counts[rec.userId] || 0) + 1;
        }
        if (rec.category && breakdown[rec.category] !== undefined) {
          breakdown[rec.category] += 1;
        }
      });

      setUsers(usersList);
      setRecords(recordsList);
      setUserCounts(counts);

      const totalU = usersList.length;
      const totalR = recordsList.length;

      setStats({
        totalUsers: totalU,
        totalRecords: totalR,
        averageRecords: totalU > 0 ? (totalR / totalU).toFixed(1) : 0,
        categoryBreakdown: breakdown,
      });
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      const errorMsg = error.message || String(error);
      if (Platform.OS === 'web') {
        alert(`❌ Hata\n\nYönetici verileri yüklenirken hata oluştu.\n\nDetay: ${errorMsg}`);
      } else {
        Alert.alert('Hata', `Yönetici verileri yüklenirken hata oluştu.\n\nDetay: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getSelectedUserRecords = () => {
    if (!selectedUser) return [];
    return records.filter((r) => r.userId === selectedUser.id);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color={colors.accent}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const getFilteredUsers = () => {
    let result = [...users];

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(queryLower)) ||
          (u.email && u.email.toLowerCase().includes(queryLower))
      );
    }

    // 2. Filter by Gender
    if (genderFilter !== 'Hepsi') {
      result = result.filter((u) => u.gender === genderFilter);
    }

    // 3. Sort by sortBy Option
    result.sort((a, b) => {
      if (sortBy === 'activity') {
        const countA = userCounts[a.id] || 0;
        const countB = userCounts[b.id] || 0;
        return countB - countA;
      } else if (sortBy === 'date') {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      } else if (sortBy === 'name') {
        const nameA = a.name ? a.name.toLowerCase() : '';
        const nameB = b.name ? b.name.toLowerCase() : '';
        return nameA.localeCompare(nameB, 'tr');
      }
      return 0;
    });

    return result;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Bilinmiyor';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };

  const filteredUsers = getFilteredUsers();

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        {/* Ambient Glows */}
        <View style={styles.glowTop} />

        {/* Dashboard Grid */}
        <View style={styles.statsGrid}>
          {/* Toplam Kullanıcı */}
          <View style={styles.statBox}>
            <View style={styles.statIconCircle}>
              <Ionicons name="people-outline" size={24} color={colors.primaryLight} />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Kayıtlı Üye</Text>
          </View>

          {/* Toplam Kayıt */}
          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.secondary + '15', borderColor: colors.secondary + '30' }]}>
              <Ionicons name="film-outline" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.statValue}>{stats.totalRecords}</Text>
            <Text style={styles.statLabel}>Toplam Yapım</Text>
          </View>

          {/* Ortalama Kayıt */}
          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
              <Ionicons name="stats-chart-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>{stats.averageRecords}</Text>
            <Text style={styles.statLabel}>Üye Ortalaması</Text>
          </View>
        </View>

        {/* Kategori Dağılımı */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Kategorilere Göre Dağılım</Text>
          <View style={styles.categoryRow}>
            {[
              { label: 'Film', key: 'Film', icon: 'film', color: colors.categories.Film },
              { label: 'Dizi', key: 'Dizi', icon: 'tv', color: colors.categories.Dizi },
              { label: 'Anime', key: 'Anime', icon: 'sparkles', color: colors.categories.Anime },
              { label: 'Kore Dizisi', key: 'Kore Dizisi', icon: 'videocam', color: colors.categories['Kore Dizisi'] },
            ].map((item) => {
              const val = stats.categoryBreakdown[item.key] || 0;
              const percentage =
                stats.totalRecords > 0
                  ? Math.round((val / stats.totalRecords) * 100)
                  : 0;

              return (
                <View key={item.key} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Ionicons name={item.icon} size={16} color={item.color} style={{ marginRight: 6 }} />
                    <Text style={styles.categoryLabel}>{item.label}</Text>
                  </View>
                  <Text style={[styles.categoryValue, { color: item.color }]}>
                    {val} <Text style={styles.categoryPercent}>({percentage}%)</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Kullanıcılar Listesi Başlık ve Arama */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Kayıtlı Kullanıcılar ({filteredUsers.length})</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="İsim veya e-posta ile ara..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Cinsiyet Filtreleme */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Cinsiyet Filtresi</Text>
          <View style={styles.filterBtnGroup}>
            {['Hepsi', 'Erkek', 'Kadın', 'Belirtmek İstemiyorum'].map((gender) => {
              const isSelected = genderFilter === gender;
              return (
                <TouchableOpacity
                  key={gender}
                  onPress={() => setGenderFilter(gender)}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive,
                    ]}
                  >
                    {gender === 'Belirtmek İstemiyorum' ? 'Belirtilmedi' : gender}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sıralama Seçenekleri */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Sıralama Seçeneği</Text>
          <View style={styles.sortBtnGroup}>
            {[
              { id: 'activity', label: 'En Aktifler', icon: 'flame-outline' },
              { id: 'date', label: 'Yeni Kayıtlar', icon: 'calendar-outline' },
              { id: 'name', label: 'İsim (A-Z)', icon: 'text-outline' },
            ].map((option) => {
              const isSelected = sortBy === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSortBy(option.id)}
                  style={[
                    styles.sortBtn,
                    isSelected && styles.sortBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={option.icon}
                    size={13}
                    color={isSelected ? '#fff' : colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.sortBtnText,
                      isSelected && styles.sortBtnTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderUserItem = ({ item }) => {
    const recordCount = userCounts[item.id] || 0;
    const initials = item.name
      ? item.name.charAt(0).toUpperCase()
      : item.email
      ? item.email.charAt(0).toUpperCase()
      : 'U';

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.85}
        onPress={() => setSelectedUser(item)}
      >
        <View style={styles.userLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name || 'İsimsiz Kullanıcı'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={styles.userDate}>
              Kayıt: {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.userRight}>
          <View style={styles.badgeContainer}>
            <Ionicons name="folder-open" size={14} color={colors.primaryLight} style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{recordCount} Yapım</Text>
          </View>

          <View style={[
            styles.genderBadgeContainer,
            {
              backgroundColor: item.gender === 'Erkek' ? 'rgba(59, 130, 246, 0.08)' : item.gender === 'Kadın' ? 'rgba(236, 72, 153, 0.08)' : 'rgba(113, 113, 122, 0.08)',
              borderColor: item.gender === 'Erkek' ? 'rgba(59, 130, 246, 0.25)' : item.gender === 'Kadın' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(113, 113, 122, 0.25)',
            }
          ]}>
            <Ionicons
              name={item.gender === 'Erkek' ? 'male-outline' : item.gender === 'Kadın' ? 'female-outline' : 'remove-circle-outline'}
              size={11}
              color={item.gender === 'Erkek' ? '#3B82F6' : item.gender === 'Kadın' ? '#EC4899' : colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.genderBadgeText,
              { color: item.gender === 'Erkek' ? '#3B82F6' : item.gender === 'Kadın' ? '#EC4899' : colors.textSecondary }
            ]}>
              {item.gender || 'Belirtilmedi'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Yönetici Paneli</Text>
        <View style={{ width: 40 }} /> {/* Spacer to align title center */}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yönetici paneli yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aradığınız kriterlere uygun kullanıcı bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Kullanıcı Detay Modalı (Eklediklerini Görme) */}
      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedUser?.name || 'Kullanıcı'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedUser?.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedUser(null)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Records List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {getSelectedUserRecords().length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="film-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.modalEmptyText}>Bu kullanıcının henüz eklediği bir yapım bulunmuyor.</Text>
                </View>
              ) : (
                getSelectedUserRecords().map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordTitle}>{record.title}</Text>
                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor:
                              colors.categories[record.category] ||
                              colors.categories.Varsayilan,
                          },
                        ]}
                      >
                        <Text style={styles.categoryBadgeText}>
                          {record.category}
                        </Text>
                      </View>
                    </View>

                    {record.genre ? (
                      <Text style={styles.recordGenre}>{record.genre}</Text>
                    ) : null}

                    <View style={styles.recordDetailsRow}>
                      <View style={styles.starsRow}>
                        {renderStars(record.rating)}
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                          {record.status}
                        </Text>
                      </View>
                    </View>

                    {record.notes ? (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Notlar:</Text>
                        <Text style={styles.notesText}>{record.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.native || StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: layout.spacing.xs,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    padding: layout.spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -150,
    left: -50,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: colors.primary,
    opacity: 0.05,
    ...Platform.select({
      web: {
        filter: 'blur(70px)',
      },
    }),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.md,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.glassSurface,
    padding: 12,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: colors.glassSurface,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryItem: {
    width: '47%',
    backgroundColor: colors.surfaceLight + '40',
    borderRadius: layout.borderRadius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border + '60',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  categoryPercent: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  listHeaderRow: {
    marginBottom: layout.spacing.sm,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.glassSurface,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    marginHorizontal: layout.spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: colors.primaryLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryLight,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  userRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  genderBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.xs,
    marginTop: 6,
  },
  genderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: layout.spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },

  /* Filter & Sort Styles */
  filterSection: {
    marginTop: 12,
  },
  filterSectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterBtnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.round,
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  filterPillActive: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primaryLight,
  },
  filterPillText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: colors.primaryLight,
    fontWeight: '850',
  },
  sortBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  sortBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.sm,
    paddingVertical: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  sortBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortBtnText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#fff',
    fontWeight: '800',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.md,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glassInput,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  modalEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  modalEmptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  /* Record Card Styles */
  recordCard: {
    backgroundColor: colors.surfaceLight + '50',
    borderRadius: layout.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.xs,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  recordGenre: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  recordDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.xs,
  },
  statusBadgeText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  notesContainer: {
    marginTop: 8,
    backgroundColor: colors.glassInput,
    borderRadius: layout.borderRadius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border + '60',
  },
  notesLabel: {
    fontSize: 10.5,
    color: colors.primaryLight,
    fontWeight: '700',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default AdminScreen;
