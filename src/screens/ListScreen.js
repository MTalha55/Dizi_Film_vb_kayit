import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Platform, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { colors, layout } from '../theme/colors';
import RecordCard from '../components/RecordCard';

const ListScreen = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Hepsi');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = ['Hepsi', 'Film', 'Dizi', 'Anime', 'Kore Dizisi'];

  useEffect(() => {
    if (!auth.currentUser) return;

    // Her kullanıcıya özel veritabanı sorgusu (sadece kendi userId'si olanları getirir)
    const q = query(
      collection(db, "records"),
      where("userId", "==", auth.currentUser.uid)
    );

    // Gerçek zamanlı Firestore dinleyicisi (onSnapshot)
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // Tarihe göre azalan sırada sırala (en yeni eklenen en üstte)
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setRecords(items);
      setLoading(false);
    }, (error) => {
      console.error("Firestore okuma hatası:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Cross-platform Silme Onay Kutusu ve İşlemi
  const handleDelete = (id, title) => {
    const performDelete = async () => {
      try {
        await deleteDoc(doc(db, "records", id));
        if (Platform.OS === 'web') {
          alert('🗑️ Başarıyla Silindi\n\nKayıt listeden silindi.');
        }
      } catch (error) {
        console.error("Silme hatası:", error);
        if (Platform.OS === 'web') {
          alert('❌ Hata\n\nKayıt silinirken bir hata oluştu.');
        } else {
          Alert.alert('Hata', 'Kayıt silinirken bir hata oluştu.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`"${title}" kaydını silmek istediğinize emin misiniz?`);
      if (confirmDelete) performDelete();
    } else {
      Alert.alert(
        'Kayıt Sil',
        `"${title}" kaydını silmek istediğinize emin misiniz?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Sil', onPress: performDelete, style: 'destructive' }
        ]
      );
    }
  };

  // Arama ve kategori filtrelemelerini uygula
  const filteredRecords = records.filter(item => {
    const matchesCategory = selectedCategory === 'Hepsi' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = !showFavoritesOnly || item.isFavorite === true;
    return matchesCategory && matchesSearch && matchesFavorite;
  });

  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={[styles.ambientGlow, { backgroundColor: colors.primary }]} />

      {/* Karşılama Başlığı */}
      <View style={styles.welcomeHeader}>
        <View>
          <Text style={styles.welcomeText}>Hoş Geldin, {auth.currentUser?.displayName || 'Kullanıcı'} 🍿</Text>
          <Text style={styles.welcomeSubtitle}>Kişisel sinema arşivini buradan yönetebilirsin.</Text>
        </View>
        <TouchableOpacity 
          style={[styles.avatarButton, { backgroundColor: colors.primary }]} 
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>
            {auth.currentUser?.displayName ? auth.currentUser.displayName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Arama Barı ve Favori Filtresi */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="İzlediklerinizde arayın..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { outlineStyle: 'none' }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={[
            styles.favFilterBtn,
            showFavoritesOnly && styles.favFilterBtnActive
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={showFavoritesOnly ? "star" : "star-outline"}
            size={20}
            color={showFavoritesOnly ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Kategori Filtre Butonları */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryBtn,
                  isSelected && styles.categoryBtnActive,
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primaryLight }
                ]}
                activeOpacity={0.85}
              >
                <Text style={[
                  styles.categoryBtnText,
                  isSelected && styles.categoryBtnTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste Alanı */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredRecords.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="film-outline" size={54} color={colors.primaryLight} />
          </View>
          <Text style={styles.emptyText}>Henüz hiç kayıt eklememişsiniz.</Text>
          <Text style={styles.emptySubtext}>
            {selectedCategory !== 'Hepsi' 
              ? `"${selectedCategory}" kategorisinde aranan yapım bulunamadı.` 
              : 'İzlediğiniz yapımları listelemek için hemen yeni bir tane ekleyin!'}
          </Text>
          {selectedCategory === 'Hepsi' && searchQuery === '' && (
            <TouchableOpacity 
              style={[styles.addBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => navigation.navigate('Add')}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>İlk Yapımını Ekle</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredRecords.map((item) => (
            <RecordCard
              key={item.id}
              item={item}
              onView={() => navigation.navigate('Detail', { id: item.id, editMode: false })}
              onEdit={() => navigation.navigate('Detail', { id: item.id, editMode: true })}
              onDelete={() => handleDelete(item.id, item.title)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.native || StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 1060,
        alignSelf: 'center',
      }
    })
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    marginVertical: layout.spacing.sm,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.round,
    flex: 1,
    paddingHorizontal: layout.spacing.md,
    height: 46,
    ...Platform.select({
      web: {
        transition: 'all 0.25s ease',
      }
    })
  },
  searchIcon: {
    marginRight: layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  categoryScrollContainer: {
    marginBottom: layout.spacing.sm,
    marginTop: 4,
  },
  categoryScroll: {
    paddingHorizontal: layout.spacing.md,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: layout.borderRadius.round,
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    })
  },
  categoryBtnActive: {
    backgroundColor: colors.primary,
    ...layout.shadows.sm,
  },
  categoryBtnText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoryBtnTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: layout.spacing.md,
    ...Platform.select({
      web: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
      }
    })
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  favFilterBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  favFilterBtnActive: {
    backgroundColor: colors.accent + '15',
    borderColor: colors.accent,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: layout.borderRadius.md,
    marginTop: 20,
    ...layout.shadows.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeHeader: {
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.md,
    marginBottom: layout.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...layout.shadows.sm,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ambientGlow: {
    position: 'absolute',
    top: -150,
    left: '25%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primary,
    opacity: 0.08,
    zIndex: -1,
    ...Platform.select({
      web: {
        filter: 'blur(85px)',
      }
    })
  }
});

export default ListScreen;
