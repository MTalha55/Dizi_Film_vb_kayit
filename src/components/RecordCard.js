import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout } from '../theme/colors';

const RecordCard = ({ item, onView, onEdit, onDelete }) => {
  const { title, category, status, rating, imageUrl, genre, genres } = item;
  const [isHovered, setIsHovered] = useState(false);

  // Kategori rengini belirle
  const getCategoryColor = () => {
    return colors.categories[category] || colors.categories.Varsayilan;
  };

  // İzleme durumu etiket metni ve rengi
  const getStatusTextAndColor = () => {
    switch (status) {
      case 'İzledim':
        return { text: 'İzledim', color: colors.success };
      case 'İzliyorum':
        return { text: 'İzliyorum', color: colors.info };
      case 'İzleyeceğim':
      default:
        return { text: 'İzleyeceğim', color: colors.accent };
    }
  };

  const statusInfo = getStatusTextAndColor();

  // Puan yıldızlarını çiz
  const renderStars = () => {
    const stars = [];
    const maxStars = 5;
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={colors.accent}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <View 
      style={[
        styles.card,
        isHovered && Platform.OS === 'web' && styles.cardHovered,
        isHovered && {
          borderColor: colors.primaryLight,
          shadowColor: colors.primary,
          ...(Platform.OS === 'web' && { boxShadow: `0 8px 24px ${colors.primary}25` })
        }
      ]}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <View style={styles.row}>
        {/* Poster / Görsel Alanı */}
        <View style={[styles.posterContainer, { borderColor: getCategoryColor() + '40' }]}>
          {imageUrl && imageUrl.trim().startsWith('http') ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.posterPlaceholder, { backgroundColor: getCategoryColor() + '08' }]}>
              <Ionicons
                name={
                  category === 'Film' ? 'film-outline' :
                  category === 'Dizi' ? 'tv-outline' :
                  category === 'Anime' ? 'sparkles-outline' :
                  'videocam-outline'
                }
                size={32}
                color={getCategoryColor()}
              />
            </View>
          )}
        </View>

        {/* Bilgi Alanı */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            {/* Kategori Rozeti */}
            <View style={[styles.badge, { backgroundColor: getCategoryColor() + '10', borderColor: getCategoryColor() + '40' }]}>
              <Text style={[styles.badgeText, { color: getCategoryColor() }]}>
                {category}
              </Text>
            </View>

            {/* Favori Rozeti */}
            {item.isFavorite && (
              <View style={[styles.badge, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '60', paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="star" size={8} color={colors.accent} />
              </View>
            )}
            
            {/* İzleme Durumu Rozeti */}
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '08', borderColor: statusInfo.color + '35' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          {/* Başlık */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Tür Bilgisi */}
          {((genres && genres.length > 0) || (genre && genre.trim() !== '')) && (
            <Text style={styles.genreText} numberOfLines={1}>
              🎬 {Array.isArray(genres) ? genres.join(', ') : genre}
            </Text>
          )}

          {/* Yıldız Değerlendirmesi */}
          <View style={styles.ratingRow}>
            {renderStars()}
            <Text style={styles.ratingText}>{rating}/5</Text>
          </View>
        </View>
      </View>

      {/* Aksiyon Butonları Alt Satırı */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={onView}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.actionBtnText}>Detay</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={colors.primaryLight} />
          <Text style={[styles.actionBtnText, { color: colors.primaryLight }]}>Güncelle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]} 
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={colors.secondary} />
          <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.native || StyleSheet.create({
  card: {
    backgroundColor: colors.glassSurface,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
    ...layout.shadows.sm,
    width: Platform.OS === 'web' ? 320 : '100%',
    ...Platform.select({
      web: {
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(12px)',
      }
    })
  },
  cardHovered: {
    borderColor: colors.primaryLight,
    transform: [{ translateY: -4 }],
    ...Platform.select({
      web: {
        boxShadow: `0 8px 24px ${colors.primary}25`,
      }
    }),
    ...layout.shadows.md,
  },
  row: {
    flexDirection: 'row',
  },
  posterContainer: {
    width: 76,
    height: 110,
    borderRadius: layout.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: layout.spacing.md,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.xs,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 4,
    lineHeight: 20,
  },
  genreText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: layout.spacing.md,
    paddingTop: layout.spacing.sm,
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      }
    })
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  deleteBtn: {
    //
  }
});

export default RecordCard;
