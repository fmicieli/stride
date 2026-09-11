import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { changePassword } from '../../services/auth';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { DarkGlassBackground } from '../../components/DarkGlassBackground';
import { dg } from '../../components/darkGlassTokens';
import { spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'ChangePassword'>;

function PasswordField({ label, value, onChangeText, onBlur, error }: { label: string; value: string; onChangeText: (t: string) => void; onBlur?: () => void; error?: string | null }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.passwordRow, error ? styles.inputError : null]}>
        <TextInput style={styles.passwordInput} value={value} onChangeText={onChangeText} onBlur={onBlur} secureTextEntry={!show} autoCapitalize="none" placeholderTextColor={dg.ink500} />
        <TouchableOpacity onPress={() => setShow((v) => !v)} style={styles.eyeButton}>
          <Icon name={show ? 'eye-off' : 'eye'} size={18} color={dg.ink500} />
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

  const newPassError = touched.newPass && newPass.length > 0 && newPass.length < 8 ? 'La contraseña debe tener al menos 8 caracteres' : null;
  const confirmError = touched.confirm && confirmPass.length > 0 && newPass !== confirmPass ? 'Las contraseñas no coinciden' : null;
  const hasErrors = !current || newPass.length < 8 || newPass !== confirmPass;

  const handleSave = async () => {
    setTouched({ current: true, newPass: true, confirm: true });
    if (hasErrors) return;
    setSaving(true);
    try {
      await changePassword(current, newPass);
      Alert.alert('Listo', 'Tu contraseña fue actualizada', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      const msg = e.code === 'auth/wrong-password' ? 'La contraseña actual es incorrecta' : 'Ocurrió un error. Intentá de nuevo';
      Alert.alert('Error', msg);
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevron-left" size={22} color={dg.ink900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cambiar contraseña</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <PasswordField label="Contraseña actual" value={current} onChangeText={setCurrent} onBlur={() => setTouched((t) => ({ ...t, current: true }))} />
            <PasswordField label="Nueva contraseña" value={newPass} onChangeText={setNewPass} onBlur={() => setTouched((t) => ({ ...t, newPass: true }))} error={newPassError} />
            <PasswordField label="Confirmar nueva contraseña" value={confirmPass} onChangeText={setConfirmPass} onBlur={() => setTouched((t) => ({ ...t, confirm: true }))} error={confirmError} />
          </ScrollView>
          <View style={styles.footer}>
            <Button
              label={saving ? 'Guardando...' : 'Guardar'}
              onPress={handleSave}
              disabled={hasErrors || saving}
              loading={saving}
              dark
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, color: dg.ink900 },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[6], paddingBottom: spacing[6], gap: spacing[5] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4] },
  inputGroup: { gap: spacing[2] },
  inputLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: dg.ink500 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', borderRadius: radius.sm, height: controlSize.md, paddingHorizontal: spacing[3], backgroundColor: 'rgba(255,255,255,0.05)' },
  inputError: { borderColor: dg.danger },
  passwordInput: { flex: 1, fontFamily: 'PlusJakartaSans', fontSize: 15, color: dg.ink900 },
  eyeButton: { padding: 4 },
  errorText: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: dg.danger },
});
