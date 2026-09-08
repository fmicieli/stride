import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../../theme';

type Achievement = { id: string; label: string; unlocked: boolean };

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', label: 'Primer entrenamiento', unlocked: true },
  { id: 'streak7', label: '7 días seguidos', unlocked: true },
  { id: 'km10', label: '10 km acumulados', unlocked: false },
  { id: 'weeks3', label: '3 semanas activas', unlocked: false },
];

function TrophyIcon({ unlocked }: { unlocked: boolean }) {
  const color = unlocked ? '#1E8563' : '#BBBBBB';
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* @ts-ignore */}
        <path d="M 8 4 L 18 4 L 18 14 C 18 17.3 15.3 20 12 20 C 8.7 20 6 17.3 6 14 L 6 4" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        {/* @ts-ignore */}
        <path d="M 6 8 L 3 8 C 3 11 5 13 7 14" stroke={color} strokeWidth="1.75" strokeLinecap="round"/>
        {/* @ts-ignore */}
        <path d="M 18 8 L 21 8 C 21 11 19 13 17 14" stroke={color} strokeWidth="1.75" strokeLinecap="round"/>
        {/* @ts-ignore */}
        <path d="M 9 20 L 9 22 L 15 22 L 15 20" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return <Text style={{ fontSize: 20, color }}>{unlocked ? '🏆' : '🔒'}</Text>;
}

function AchievementBox({ achievement }: { achievement: Achievement }) {
  return (
    <View style={[styles.achvBox, !achievement.unlocked && styles.achvBoxLocked]}>
      <TrophyIcon unlocked={achievement.unlocked} />
      <Text style={[styles.achvLabel, !achievement.unlocked && styles.achvLabelLocked]}>
        {achievement.label}
      </Text>
    </View>
  );
}

export function LogrosScreen() {
  const navigation = useNavigation();

  const rows: Achievement[][] = [];
  for (let i = 0; i < ACHIEVEMENTS.length; i += 2) {
    rows.push(ACHIEVEMENTS.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Logros</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Hitos que vas desbloqueando a medida que entrenás.</Text>

        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((a) => <AchievementBox key={a.id} achievement={a} />)}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], height: 56, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: colors.ink[900] },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, color: colors.ink[900] },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[10], gap: spacing[5] },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#555555', lineHeight: 18 },
  grid: { gap: spacing[3] },
  row: { flexDirection: 'row', gap: spacing[3] },
  achvBox: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], gap: spacing[2], minHeight: 108 },
  achvBoxLocked: { opacity: 0.6 },
  achvLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, color: colors.ink[900], lineHeight: 17 },
  achvLabelLocked: { color: '#999999' },
});
