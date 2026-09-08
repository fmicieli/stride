import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getSessions } from '../../services/firestore';
import { TrainingSession } from '../../types';
import { formatPace } from '../../utils/planGenerator';
import { Icon } from '../../components/Icon';
import { colors, spacing, radius } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Historial'>;

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

function SessionCard({ session }: { session: TrainingSession }) {
  return (
    <View style={styles.sessionCard}>
      <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
      <Text style={styles.sessionType}>{session.type || 'Trote con intervalos'}</Text>
      <Text style={styles.statText}>
        {session.distance.toFixed(1)} km   {Math.round(session.duration / 60)} min   {formatPace(session.pace)} /km
      </Text>
    </View>
  );
}

export function HistorialScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getSessions(user.uid).then(setSessions).finally(() => setLoading(false));
  }, [user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={22} color={colors.ink[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin sesiones aún</Text>
          <Text style={styles.emptyText}>Tus entrenamientos completados aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <SessionCard session={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: colors.ink[900] },
  headerSpacer: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[8], gap: spacing[3] },
  sessionCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], gap: 6 },
  sessionDate: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400], letterSpacing: 0.3 },
  sessionType: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, color: colors.ink[900] },
  statText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[400], letterSpacing: 0.3, fontVariant: ['tabular-nums'] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: spacing[3] },
  emptyTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900] },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], textAlign: 'center', lineHeight: 20 },
});
