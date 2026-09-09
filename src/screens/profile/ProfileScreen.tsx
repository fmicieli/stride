import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { deletePlan } from '../../services/firestore';
import { logout, deleteAccount } from '../../services/auth';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList>;
type ModalType = 'logout' | 'changeGoal' | 'deleteAccount' | null;

function SettingsRow({ label, onPress, destructive = false, chevron = true }: { label: string; onPress: () => void; destructive?: boolean; chevron?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.settingsLabel, destructive && styles.destructiveText]}>{label}</Text>
      {chevron && !destructive && <Icon name="chevron" size={20} color={colors.ink[300]} />}
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
    try { await deletePlan(user.uid); setActiveModal(null); navigation.navigate('OnboardingGoal'); }
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
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editBtn}
          />
          */}
        </View>

        <View style={styles.settingsList}>
          <SettingsRow label="Mi plan" onPress={() => navigation.navigate('MyPlan')} />
          <SettingsRow label="Historial de entrenamientos" onPress={() => navigation.navigate('Historial')} />
          <SettingsRow label="Cambiar objetivo" onPress={() => setActiveModal('changeGoal')} />
          <SettingsRow label="Cambiar contraseña" onPress={() => navigation.navigate('ChangePassword')} />
          <SettingsRow label="Cerrar sesión" onPress={() => setActiveModal('logout')} chevron={false} />
          <SettingsRow label="Eliminar cuenta" onPress={() => setActiveModal('deleteAccount')} destructive />
        </View>
      </ScrollView>

      <Modal visible={activeModal === 'changeGoal'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Querés cambiar tu objetivo?</Text>
            <Text style={styles.modalText}>Tu historial se mantiene, pero tu plan actual se va a reemplazar.</Text>
            <View style={styles.modalButtons}>
              <Button label={loading ? 'Procesando...' : 'Sí, cambiar objetivo'} onPress={handleChangeGoal} disabled={loading} loading={loading} />
              <Button label="Cancelar" variant="ghost" onPress={() => setActiveModal(null)} disabled={loading} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'logout'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Querés cerrar sesión?</Text>
            <View style={styles.modalButtons}>
              <Button label={loading ? 'Saliendo...' : 'Cerrar sesión'} onPress={handleLogout} disabled={loading} loading={loading} />
              <Button label="Cancelar" variant="ghost" onPress={() => setActiveModal(null)} disabled={loading} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'deleteAccount'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Querés eliminar tu cuenta?</Text>
            <Text style={styles.modalText}>Esta acción es permanente. Perderás tu plan, historial y todos tus datos.</Text>
            <TextInput
              style={[
                styles.passwordInput,
                pwFocused && styles.passwordInputFocused,
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
              ]}
              placeholder="Ingresá tu contraseña"
              placeholderTextColor={colors.ink[300]}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.destructiveButton, loading && styles.disabled]} activeOpacity={0.8} onPress={handleDeleteAccount} disabled={loading}>
                <Text style={styles.destructiveButtonText}>{loading ? 'Eliminando...' : 'Eliminar cuenta'}</Text>
              </TouchableOpacity>
              <Button label="Cancelar" variant="ghost" onPress={() => { setActiveModal(null); setDeletePassword(''); }} disabled={loading} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing[10] },
  avatarSection: { alignItems: 'center', paddingTop: spacing[8], paddingBottom: spacing[6], gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 34, color: colors.ink[900] },
  displayName: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, color: colors.ink[900] },
  email: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[400] },
  editBtn: { marginTop: 8, alignSelf: 'center' },
  settingsList: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  settingsLabel: { fontFamily: 'PlusJakartaSans', fontSize: 16, color: colors.ink[900] },
  destructiveText: { color: colors.error.text },
  modalOverlay: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  modalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing[6], width: '100%' },
  modalTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, color: colors.ink[900], marginBottom: 8, textAlign: 'center' },
  modalText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], marginBottom: spacing[2], lineHeight: 20, textAlign: 'center' },
  passwordInput: { borderWidth: 1.5, borderColor: colors.borderDefault, borderRadius: radius.sm, height: controlSize.md, paddingHorizontal: spacing[3], fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[900], marginBottom: spacing[4], marginTop: spacing[4] },
  passwordInputFocused: { borderColor: colors.brand[500] },
  modalButtons: { gap: spacing[3], marginTop: spacing[6] },
  destructiveButton: { backgroundColor: colors.error.solid, borderRadius: radius.full, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  destructiveButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 15 },
  disabled: { opacity: 0.4 },
});
