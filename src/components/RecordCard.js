import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout } from '../theme/colors';

const { width } = Dimensions.get('window');

const RecordCard = ({ item, onView, onEdit, onDelete }) => {
  const { title, category, status, rating, imageUrl, genre, genres, isFavorite } = item;
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryColor = () => {
    return colors.categories[category] || colors.categories.Varsayilan;
  };

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

  const isWeb = Platform.OS === 'web';

  return (
    <View 
      style={[
        styles.card,
        isHovered && isWeb && styles.cardHovered,
        isHovered && isWeb && {
          borderColor: colors.borderLight,
          shadowColor: getCategoryColor(),
          boxShadow: `0 12px 32px ${getCategoryColor()}30`
        }
      ]}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <View style={styles.row}>
        {/* Poster */}
        <TouchableOpacity 
          style={styles.posterContainer}
          activeOpacity={0.8}
          onPress={onView}
        >
          {imageUrl && (imageUrl.trim().startsWith('http') || imageUrl.trim().startsWith('data:') || imageUrl.trim().startsWith('file:')) ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.posterPlaceholder, { backgroundColor: getCategoryColor() + '15' }]}>
              <Ionicons
                name={
                  category === 'Film' ? 'film' :
                  category === 'Dizi' ? 'tv' :
                  category === 'Anime' ? 'sparkles' :
                  'videocam'
                }
                size={36}
                color={getCategoryColor()}
              />
            </View>
          )}
          {/* Karanlık Gradyan Efekti - Posterin altına gölge */}
          <View style={styles.posterOverlay} />
        </TouchableOpacity>

        {/* Bilgi */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            {/* Kategori */}
            <View style={[styles.badge, { backgroundColor: getCategoryColor() + '15', borderColor: getCategoryColor() + '40' }]}>
              <Text style={[styles.badgeText, { color: getCategoryColor() }]}>
                {category}
              </Text>
            </View>

            {/* Favori */}
            {isFavorite && (
              <View style={[styles.badge, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '60', paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="star" size={10} color={colors.accent} />
              </View>
            )}
            
            {/* Durum */}
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color + '35' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onView} activeOpacity={0.7}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </TouchableOpacity>

          {((genres && genres.length > 0) || (genre && genre.trim() !== '')) && (
            <Text style={styles.genreText} numberOfLines={1}>
              {Array.isArray(genres) ? genres.join(' • ') : genre.replace(/,/g, ' • ')}
            </Text>
          )}

          <View style={styles.ratingRow}>
            {renderStars()}
            <Text style={styles.ratingText}>{rating}/5</Text>
          </View>
        </View>
      </View>

      {/* Aksiyonlar */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onView} activeOpacity={0.6}>
          <Ionicons name="eye" size={18} color={colors.textSecondary} />
          <Text style={styles.actionBtnText}>İncele</Text>
        </TouchableOpacity>
        
        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.6}>
          <Ionicons name="create" size={18} color={colors.primaryLight} />
          <Text style={[styles.actionBtnText, { color: colors.primaryLight }]}>Düzenle</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionBtn} onPress={onDelete} activeOpacity={0.6}>
          <Ionicons name="trash" size={18} color={colors.secondary} />
          <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassSurface,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: layout.spacing.md,
    width: isWeb ? 340 : '100%',
    ...layout.shadows.md,
    ...Platform.select({
      web: {
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        backdropFilter: 'blur(16px)',
      }
    })
  },
  cardHovered: {
    transform: [{ translateY: -6 }, { scale: 1.02 }],
  },
  row: {
    flexDirection: 'row',
  },
  posterContainer: {
    width: 85,
    height: 125,
    borderRadius: layout.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...layout.shadows.sm,
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
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  infoContainer: {
    flex: 1,
    marginLeft: layout.spacing.md,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.xs,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  genreText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    paddingTop: 12,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    ...Platform.select({
      web: {
        transition: 'opacity 0.2s',
      }
    })
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  actionDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.border,
  }
});

export default RecordCard;
