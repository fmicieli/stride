import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { registerWithEmail, signInWithGoogle } from '../../services/auth';
import { saveUserProfile, savePlan, getPlan } from '../../services/firestore';
import { useOnboarding } from '../../utils/onboardingContext';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { GoogleGlyph } from '../../components/GoogleGlyph';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Register'>;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { pendingPlan, reset: resetOnboarding } = useOnboarding();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const emailError = touched.email && email.length > 0 && !isValidEmail(email) ? 'Ingresá un email válido' : null;
  const passwordError = touched.password && password.length > 0 && password.length < 8 ? 'Mínimo 8 caracteres' : null;
  const confirmError = touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword ? 'Las contraseñas no coinciden' : null;
  const hasErrors = !name.trim() || !email.trim() || !isValidEmail(email) || password.length < 8 || password !== confirmPassword;

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const { user: loggedUser } = await signInWithGoogle();
      if (pendingPlan) {
        await savePlan(loggedUser.uid, pendingPlan);
        await saveUserProfile(loggedUser.uid, { onboardingDone: true } as any);
        resetOnboarding();
        navigation.replace('MainTabs');
      } else {
        const existingPlan = await getPlan(loggedUser.uid);
        navigation.replace(existingPlan ? 'MainTabs' : 'OnboardingGoal');
      }
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Error', 'No se pudo iniciar sesión con Google. Intentá de nuevo.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (hasErrors) return;
    setLoading(true);
    try {
      const { user } = await registerWithEmail(email.trim(), password);
      await saveUserProfile(user.uid, { name: name.trim(), email: email.trim() });
      if (pendingPlan) {
        await savePlan(user.uid, pendingPlan);
        await saveUserProfile(user.uid, { onboardingDone: true } as any);
        resetOnboarding();
      }
      navigation.replace('MainTabs');
    } catch (e: any) {
      const msg =
        e.code === 'auth/email-already-in-use' ? 'Ese email ya está registrado'
        : e.code === 'auth/invalid-email' ? 'Email inválido'
        : 'Ocurrió un error. Intentá de nuevo';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Creá tu cuenta</Text>
          <Text style={styles.subtitle}>Solo para guardar tu progreso. No pedimos tarjeta.</Text>
          {[
            { label: 'Nombre', value: name, setter: setName, placeholder: 'Tu nombre', field: 'name' as const, capitalize: 'words' as const },
          ].map(({ label, value, setter, placeholder, field, capitalize }) => (
            <View key={field} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setter}
                placeholder={placeholder}
                placeholderTextColor={colors.ink[300]}
                autoCapitalize={capitalize}
                onBlur={() => setTouched((t) => ({ ...t, [field]: true }))}
              />
            </View>
          ))}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.ink[300]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={[styles.passwordRow, passwordError ? styles.inputError : null]}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={colors.ink[300]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.ink[400]} />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmar contraseña</Text>
            <View style={[styles.passwordRow, confirmError ? styles.inputError : null]}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repetí tu contraseña"
                placeholderTextColor={colors.ink[300]}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeButton}>
                <Icon name={showConfirm ? 'eye-off' : 'eye'} size={18} color={colors.ink[400]} />
              </TouchableOpacity>
            </View>
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
          </View>

          <Button
            label={loading ? 'Creando cuenta...' : 'Crear cuenta'}
            onPress={handleRegister}
            disabled={hasErrors || loading}
            loading={loading}
            style={styles.ctaSpacing}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {Platform.OS === 'web' && (
            <Button
              variant="secondary"
              label="Continuar con Google"
              iconLeft={<GoogleGlyph />}
              loading={googleLoading}
              onPress={handleGoogleRegister}
            />
          )}

          <Text style={styles.footerNote}>Sin tarjeta. Sin período de prueba que vencer.</Text>

          <TouchableOpacity style={styles.linkButton} activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              {'¿Ya tenés cuenta? '}<Text style={styles.linkBold}>Iniciá sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: colors.ink[900] },
  scrollContent: { paddingHorizontal: spacing[4], paddingBottom: spacing[8], gap: spacing[4], paddingTop: spacing[2] },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900] },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500], lineHeight: 22, marginTop: -spacing[2] },
  inputGroup: { gap: spacing[2] },
  inputLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: colors.ink[700],
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    borderRadius: radius.sm,
    height: controlSize.md,
    paddingHorizontal: spacing[3],
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    color: colors.ink[900],
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.error.solid },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    borderRadius: radius.sm,
    height: controlSize.md,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.surface,
  },
  passwordInput: { flex: 1, fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[900] },
  eyeButton: { padding: 4 },
  errorText: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12,
    color: colors.error.text,
  },
  ctaSpacing: { marginTop: spacing[2] },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderDefault },
  dividerText: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[400] },
  footerNote: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[300], textAlign: 'center' },
  linkButton: { alignItems: 'center', paddingVertical: spacing[2] },
  linkText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500] },
  linkBold: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.ink[900] },
});
