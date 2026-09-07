import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getSessions } from '../../services/firestore';
import { TrainingSession } from '../../types';
import { formatDuration, formatPace } from '../../utils/planGenerator';

type Nav = StackNavigationProp<RootStackParamList, 'Historial'>;

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function SessionCard({ session }: { session: TrainingSession }) {
  return (
    <View style={styles.sessionCard}>
      <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
      <Text style={styles.sessionType}>{session.type || 'Trote'}</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statText}>{session.distance.toFixed(2)} km</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>{formatDuration(session.duration)}</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>{formatPace(session.pace)}/km</Text>
      </View>
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
    getSessions(user.uid)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#111111" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin sesiones aún</Text>
          <Text style={styles.emptyText}>
            Tus entrenamientos completados aparecerán aquí
          </Text>
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
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#111111',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  sessionDate: {
    fontSize: 12,
    color: '#888888',
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
  },
  statDot: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
