import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  dark?: boolean; // dark = fondo negro (default), light = variante inversa
}

export function PrimaryButton({ label, onPress, disabled = false, loading = false, dark = true }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        dark ? styles.dark : styles.light,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={dark ? '#FFFFFF' : '#111111'} />
      ) : (
        <Text style={[styles.label, dark ? styles.labelDark : styles.labelLight]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dark: {
    backgroundColor: '#111111',
  },
  light: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelDark: {
    color: '#FFFFFF',
  },
  labelLight: {
    color: '#111111',
  },
});
