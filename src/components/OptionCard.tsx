import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, borderWidth } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    borderWidth: borderWidth.hairline,
    borderColor: colors.borderDefault,
  },
  selected: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[500],
    borderWidth: borderWidth.selected,
  },
  text: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    color: colors.ink[900],
  },
  selectedText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.brand[600],
  },
});
