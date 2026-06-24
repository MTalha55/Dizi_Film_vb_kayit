import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, Platform } from 'react-native';
import { colors, layout } from '../theme/colors';

const CustomButton = ({ 
  title, 
  onPress, 
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger'
  loading = false, 
  disabled = false, 
  style, 
  textStyle,
  icon
}) => {
  const isOutline = variant === 'outline';
  
  // Stilleri belirle
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.btn, styles.btnSecondary];
      case 'outline':
        return [styles.btn, styles.btnOutline];
      case 'danger':
        return [styles.btn, styles.btnDanger];
      case 'primary':
      default:
        return [styles.btn, styles.btnPrimary];
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (isOutline) return colors.primaryLight;
    if (variant === 'secondary') return colors.textSecondary;
    return '#FFFFFF'; // primary ve danger için yüksek kontrastlı beyaz metin
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getButtonStyle(),
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'outline' && { borderColor: colors.primaryLight },
        (disabled || loading) && styles.disabledBtn,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[
            styles.btnText, 
            { color: getTextColor() },
            textStyle
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: layout.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      }
    })
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    ...layout.shadows.md,
  },
  btnSecondary: {
    backgroundColor: colors.glassInput,
    borderColor: colors.border,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.primaryLight,
  },
  btnDanger: {
    backgroundColor: colors.secondary,
    ...layout.shadows.sm,
  },
  disabledBtn: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: layout.spacing.sm,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  }
});

export default CustomButton;
