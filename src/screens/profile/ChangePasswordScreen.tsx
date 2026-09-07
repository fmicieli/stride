import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { changePassword } from '../../services/auth';

type Nav = StackNavigationProp<RootStackParamList, 'ChangePassword'>;

function PasswordField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur?: () => void;
  error?: string | null;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.passwordRow, error ? styles.inputError : null]}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={!show}
          autoCapitalize="none"
          placeholderTextColor="#AAAAAA"
        />
        <TouchableOpacity onPress={() => setShow((v) => !v)} style={styles.eyeButton}>
          <Text style={styles.eyeIcon}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [touched, setTouched] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const newPassError =
    touched.newPass && newPass.length > 0 && newPass.length < 8
      ? 'La contraseña debe tener al menos 8 caracteres'
      : null;

  const confirmError =
    touched.confirm && confirmPass.length > 0 && newPass !== confirmPass
      ? 'Las contraseñas no coinciden'
      : null;

  const hasErrors = !current || newPass.length < 8 || newPass !== confirmPass;

  const handleSave = async () => {
    setTouched({ current: true, newPass: true, confirm: true });
    if (hasErrors) return;
    setSaving(true);
    try {
      await changePassword(current, newPass);
      Alert.alert('Listo', 'Tu contraseña fue actualizada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const msg =
        e.code === 'auth/wrong-password'
          ? 'La contraseña actual es incorrecta'
          : 'Ocurrió un error. Intentá de nuevo';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PasswordField
            label="Contraseña actual"
            value={current}
            onChangeText={setCurrent}
            onBlur={() => setTouched((t) => ({ ...t, current: true }))}
          />

          <PasswordField
            label="Nueva contraseña"
            value={newPass}
            onChangeText={setNewPass}
            onBlur={() => setTouched((t) => ({ ...t, newPass: true }))}
            error={newPassError}
          />

          <PasswordField
            label="Confirmar nueva contraseña"
            value={confirmPass}
            onChangeText={setConfirmPass}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            error={confirmError}
          />

          <TouchableOpacity
            style={[styles.primaryButton, (hasErrors || saving) && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111111',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E53935',
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
