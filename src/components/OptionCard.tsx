import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { radius } from '../theme';

const CARD_BG = '#1A1A1D';
const CARD_BG_SELECTED = 'rgba(143,224,90,0.12)';
const BORDER = 'rgba(255,255,255,0.10)';
const BORDER_SELECTED = '#8FE05A';
const TEXT = '#FFFFFF';
const TEXT_SELECTED = '#8FE05A';

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
    backgroundColor: CARD_BG,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  selected: {
    backgroundColor: CARD_BG_SELECTED,
    borderColor: BORDER_SELECTED,
    borderWidth: 1.5,
  },
  text: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    color: TEXT,
  },
  selectedText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: TEXT_SELECTED,
  },
});
