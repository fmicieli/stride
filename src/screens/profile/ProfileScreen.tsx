import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { deletePlan } from '../../services/firestore';
import { pendingRun } from '../../storage/storage';
import { logout, deleteAccount } from '../../services/auth';
import { Button } from '../../components/Button';
import { BottomSheet } from '../../components/BottomSheet';
import { DarkGlassBackground } from '../../components/DarkGlassBackground';
import { GlassCard } from '../../components/GlassCard';
import { Icon } from '../../components/Icon';
import { dg } from '../../components/darkGlassTokens';
import { spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList>;
type ModalType = 'logout' | 'changeGoal' | 'deleteAccount' | null;

function SettingsRow({ label, onPress, destructive = false, chevron = true, last = false }: { label: string; onPress: () => void; destructive?: boolean; chevron?: boolean; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.settingsRow, !last && styles.settingsRowDivider]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.settingsLabel, destructive && styles.destructiveText]}>{label}</Text>
      {chevron && !destructive && <Icon name="chevron" size={20} color={dg.ink500} />}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, profile } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [pwFocused, setPwFocused] = useState(false);

  const displayName = profile ? [profile.name, profile.lastName].filter(Boolean).join(' ') : 'Runner';
  const initial = (profile?.name || 'R').charAt(0).toUpperCase();

  const handleLogout = async () => {
    setLoading(true);
    try { await logout(); setActiveModal(null); navigation.navigate('Welcome'); }
    finally { setLoading(false); }
  };

  const handleChangeGoal = async () => {
    if (!user) return;
    setLoading(true);
    try { await Promise.all([deletePlan(user.uid), pendingRun.clear()]); setActiveModal(null); navigation.navigate('OnboardingGoal'); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) { Alert.alert('Error', 'Ingresá tu contraseña para confirmar'); return; }
    setLoading(true);
    try {
      await deleteAccount(deletePassword);
      setActiveModal(null);
      setDeletePassword('');
      navigation.navigate('Welcome');
    } catch (e: any) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' ? 'Contraseña incorrecta' : 'Ocurrió un error. Intentá de nuevo';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.email}>{profile?.email || user?.email || ''}</Text>
            {/* "Editar Perfil" — pendiente para la próxima versión
            <Button
              label="Editar Perfil"
              variant="secondary"
              size="sm"
              fullWidth={false}
              dark
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.editBtn}
            />
            */}
          </View>

          <GlassCard variant="secondary" style={styles.settingsList}>
            <SettingsRow label="Mi plan" onPress={() => navigation.navigate('MyPlan')} />
            <SettingsRow label="Historial de entrenamientos" onPress={() => navigation.navigate('Historial')} />
            <SettingsRow label="Cambiar objetivo" onPress={() => setActiveModal('changeGoal')} />
            <SettingsRow label="Cambiar contraseña" onPress={() => navigation.navigate('ChangePassword')} />
            <SettingsRow label="Cerrar sesión" onPress={() => setActiveModal('logout')} chevron={false} />
            <SettingsRow label="Eliminar cuenta" onPress={() => setActiveModal('deleteAccount')} destructive last />
          </GlassCard>
        </ScrollView>

        <BottomSheet
          visible={activeModal === 'changeGoal'}
          onClose={() => setActiveModal(null)}
          title="¿Querés cambiar tu objetivo?"
          subtitle="Tu historial se mantiene, pero tu plan actual se va a reemplazar."
          dark
        >
          <Button label={loading ? 'Procesando...' : 'Sí, cambiar objetivo'} onPress={handleChangeGoal} disabled={loading} loading={loading} dark />
          <Button label="Cancelar" variant="ghost" onPress={() => setActiveModal(null)} disabled={loading} dark />
        </BottomSheet>

        <BottomSheet
          visible={activeModal === 'logout'}
          onClose={() => setActiveModal(null)}
          title="¿Querés cerrar sesión?"
          dark
        >
          <Button label={loading ? 'Saliendo...' : 'Cerrar sesión'} onPress={handleLogout} disabled={loading} loading={loading} dark />
          <Button label="Cancelar" variant="ghost" onPress={() => setActiveModal(null)} disabled={loading} dark />
        </BottomSheet>

        <BottomSheet
          visible={activeModal === 'deleteAccount'}
          onClose={() => { setActiveModal(null); setDeletePassword(''); }}
          title="¿Querés eliminar tu cuenta?"
          subtitle="Esta acción es permanente. Perderás tu plan, historial y todos tus datos."
          dark
        >
          <TextInput
            style={[
              styles.passwordInput,
              pwFocused && styles.passwordInputFocused,
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
            placeholder="Ingresá tu contraseña"
            placeholderTextColor={dg.ink500}
            secureTextEntry
            value={deletePassword}
            onChangeText={setDeletePassword}
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
            autoCapitalize="none"
          />
          <TouchableOpacity style={[styles.destructiveButton, loading && styles.disabled]} activeOpacity={0.8} onPress={handleDeleteAccount} disabled={loading}>
            <Text style={styles.destructiveButtonText}>{loading ? 'Eliminando...' : 'Eliminar cuenta'}</Text>
          </TouchableOpacity>
          <Button label="Cancelar" variant="ghost" onPress={() => { setActiveModal(null); setDeletePassword(''); }} disabled={loading} dark />
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing[4], paddingBottom: spacing[10] },
  avatarSection: { alignItems: 'center', paddingTop: spacing[6], paddingBottom: spacing[6], gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 34, color: dg.ink900 },
  displayName: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, color: dg.ink900 },
  email: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: dg.ink500 },
  editBtn: { marginTop: 8, alignSelf: 'center' },
  settingsList: { borderRadius: 16, paddingVertical: 4, paddingHorizontal: spacing[4] },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
  settingsRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  settingsLabel: { fontFamily: 'PlusJakartaSans', fontSize: 16, color: dg.ink900 },
  destructiveText: { color: dg.danger },
  passwordInput: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.sm, height: controlSize.md, paddingHorizontal: spacing[3], fontFamily: 'PlusJakartaSans', fontSize: 15, color: dg.ink900 },
  passwordInputFocused: { borderColor: dg.accent },
  destructiveButton: { backgroundColor: '#C4453D', borderRadius: radius.full, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  destructiveButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: '#FFFFFF', fontSize: 15 },
  disabled: { opacity: 0.4 },
});
