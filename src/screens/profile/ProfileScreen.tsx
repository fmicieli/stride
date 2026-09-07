import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { deletePlan } from '../../services/firestore';
import { logout, deleteAccount } from '../../services/auth';

type Nav = StackNavigationProp<RootStackParamList>;

type ModalType = 'logout' | 'changeGoal' | 'deleteAccount' | null;

function SettingsRow({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
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

  const displayName = profile
    ? [profile.name, profile.lastName].filter(Boolean).join(' ')
    : 'Runner';
  const initial = (profile?.name || 'R').charAt(0).toUpperCase();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setActiveModal(null);
      navigation.navigate('Welcome');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeGoal = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await deletePlan(user.uid);
      setActiveModal(null);
      navigation.navigate('OnboardingGoal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Ingresá tu contraseña para confirmar');
      return;
    }
    setLoading(true);
    try {
      await deleteAccount(deletePassword);
      setActiveModal(null);
      setDeletePassword('');
      navigation.navigate('Welcome');
    } catch (e: any) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Contraseña incorrecta'
        : 'Ocurrió un error. Intentá de nuevo';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
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
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsList}>
          <SettingsRow
            label="Cambiar contraseña"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsRow
            label="Historial de Entrenamientos"
            onPress={() => navigation.navigate('Historial')}
          />
          <SettingsRow
            label="Cambiar objetivo"
            onPress={() => setActiveModal('changeGoal')}
          />
          <SettingsRow
            label="Cerrar sesión"
            onPress={() => setActiveModal('logout')}
          />
          <SettingsRow
            label="Eliminar cuenta"
            onPress={() => setActiveModal('deleteAccount')}
            destructive
          />
        </View>
      </ScrollView>

      <Modal visible={activeModal === 'changeGoal'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Querés cambiar tu objetivo?</Text>
            <Text style={styles.modalText}>
              Tu historial se mantiene, pero tu plan actual se va a reemplazar.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleChangeGoal}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Procesando...' : 'Sí, cambiar objetivo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setActiveModal(null)}
                disabled={loading}
              >
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
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleLogout}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Saliendo...' : 'Cerrar sesión'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setActiveModal(null)}
                disabled={loading}
              >
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
            <Text style={styles.modalText}>
              Esta acción es permanente. Perderás tu plan, historial y todos tus datos.
            </Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Ingresá tu contraseña"
              placeholderTextColor="#AAAAAA"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.destructiveButton, loading && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleDeleteAccount}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Eliminando...' : 'Eliminar cuenta'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setActiveModal(null); setDeletePassword(''); }}
                disabled={loading}
              >
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
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#111111',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  email: {
    fontSize: 14,
    color: '#888888',
  },
  editBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  editBtnText: {
    fontSize: 14,
    color: '#666666',
  },
  settingsList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsLabel: {
    fontSize: 16,
    color: '#111111',
  },
  destructiveText: {
    color: '#E53935',
  },
  chevron: {
    fontSize: 22,
    color: '#CCCCCC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111111',
    marginBottom: 16,
  },
  modalButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666666',
  },
});
