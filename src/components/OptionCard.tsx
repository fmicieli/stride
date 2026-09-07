import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

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
    height: 56,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selected: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[500],
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
