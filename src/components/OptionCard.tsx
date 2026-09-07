import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

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
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#111111',
  },
  text: {
    fontSize: 16,
    color: '#111111',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});
