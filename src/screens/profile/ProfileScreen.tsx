import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { deletePlan } from '../../services/firestore';
import { logout, deleteAccount } from '../../services/auth';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList>;
type ModalType = 'logout' | 'changeGoal' | 'deleteAccount' | null;

function SettingsRow({ label, onPress, destructive = false }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.settingsLabel, destructive && styles.destructiveText]}>{label}</Text>
      {!destructive && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, profile } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{profile?.email || user?.email || ''}</Text>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsList}>
          <SettingsRow label="Cambiar contraseña" onPress={() => navigation.navigate('ChangePassword')} />
          <SettingsRow label="Historial de Entrenamientos" onPress={() => navigation.navigate('Historial')} />
          <SettingsRow label="Cambiar objetivo" onPress={() => setActiveModal('changeGoal')} />
          <SettingsRow label="Cerrar sesión" onPress={() => setActiveModal('logout')} />
          <SettingsRow label="Eliminar cuenta" onPress={() => setActiveModal('deleteAccount')} destructive />
        </View>
      </ScrollView>

      <Modal visible={activeModal === 'changeGoal'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Querés cambiar tu objetivo?</Text>
            <Text style={styles.modalText}>Tu historial se mantiene, pero tu plan actual se va a reemplazar.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.primaryButton, loading && styles.disabled]} activeOpacity={0.8} onPress={handleChangeGoal} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? 'Procesando...' : 'Sí, cambiar objetivo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal(null)} disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'logout'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Querés cerrar sesión?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.primaryButton, loading && styles.disabled]} activeOpacity={0.8} onPress={handleLogout} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? 'Saliendo...' : 'Cerrar sesión'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal(null)} disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
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
              style={styles.passwordInput}
              placeholder="Ingresá tu contraseña"
              placeholderTextColor={colors.ink[300]}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.destructiveButton, loading && styles.disabled]} activeOpacity={0.8} onPress={handleDeleteAccount} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? 'Eliminando...' : 'Eliminar cuenta'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setActiveModal(null); setDeletePassword(''); }} disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: colors.ink[900] },
  headerTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, color: colors.ink[900] },
  headerSpacer: { width: 40 },
  content: { paddingBottom: spacing[10] },
  avatarSection: { alignItems: 'center', paddingTop: spacing[8], paddingBottom: spacing[6], gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 32, color: colors.brand[600] },
  displayName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900] },
  email: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[400] },
  editBtn: { marginTop: 8, borderWidth: 1.5, borderColor: colors.borderDefault, borderRadius: radius.full, paddingVertical: 8, paddingHorizontal: spacing[5] },
  editBtnText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[600] },
  settingsList: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  settingsLabel: { fontFamily: 'PlusJakartaSans', fontSize: 16, color: colors.ink[900] },
  destructiveText: { color: colors.error.text },
  chevron: { fontSize: 22, color: colors.ink[300] },
  modalOverlay: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  modalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing[6], width: '100%' },
  modalTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, color: colors.ink[900], marginBottom: 8 },
  modalText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], marginBottom: spacing[6], lineHeight: 20 },
  passwordInput: { borderWidth: 1.5, borderColor: colors.borderDefault, borderRadius: radius.sm, height: controlSize.md, paddingHorizontal: spacing[3], fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[900], marginBottom: spacing[4] },
  modalButtons: { gap: spacing[3] },
  primaryButton: { backgroundColor: colors.brand[500], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 15 },
  destructiveButton: { backgroundColor: colors.error.solid, borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.6 },
  cancelButton: { height: controlSize.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500] },
});
