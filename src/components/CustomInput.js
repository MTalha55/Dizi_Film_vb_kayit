import React, { useState, useRef, forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout } from '../theme/colors';

const CustomInput = forwardRef((
  {
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    error,
    iconName,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoComplete,
    returnKeyType,
    onSubmitEditing,
    style,
    ...props
  },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const inputRef = useRef(null);

  // Dışarıdan ref gelmişse onu, yoksa kendi internal ref'imizi kullanalım
  const resolvedRef = ref || inputRef;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => resolvedRef?.current?.focus()}
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          isFocused && { 
            borderColor: colors.primaryLight,
            shadowColor: colors.primary,
            ...(Platform.OS === 'web' && { boxShadow: `0 0 10px ${colors.primary}30` })
          },
          error && styles.inputError,
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={error ? colors.danger : isFocused ? colors.primary : colors.textSecondary}
            style={styles.icon}
          />
        )}

        <TextInput
          ref={resolvedRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && hidePassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={!onSubmitEditing}
          style={[styles.input, { outlineStyle: 'none' }]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.native || StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: layout.spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: layout.spacing.xs,
    fontWeight: '600',
    paddingLeft: 4,
    letterSpacing: 0.5,
  },
  inputContainer: {
    height: 50,
    backgroundColor: colors.glassInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    ...Platform.select({
      web: {
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    })
  },
  inputFocused: {
    borderColor: colors.primaryLight,
    ...Platform.select({
      web: {
        boxShadow: `0 0 10px ${colors.primary}30`,
      }
    }),
    ...layout.shadows.sm,
  },
  inputError: {
    borderColor: colors.danger,
    ...Platform.select({
      web: {
        boxShadow: `0 0 10px ${colors.danger}30`,
      }
    })
  },
  icon: {
    marginRight: layout.spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    height: '100%',
    padding: 0,
  },
  eyeIcon: {
    padding: layout.spacing.xs,
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
    paddingLeft: 4,
    fontWeight: '500',
  }
});

export default CustomInput;
