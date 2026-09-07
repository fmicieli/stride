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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { registerWithEmail, signInWithGoogle } from '../../services/auth';
import { saveUserProfile, savePlan, getPlan } from '../../services/firestore';
import { useOnboarding } from '../../utils/onboardingContext';
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
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
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
                <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (hasErrors || loading) && styles.disabled]}
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.disabled]}
              activeOpacity={0.85}
              onPress={handleGoogleRegister}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.ink[900]} size="small" />
              ) : (
                <>
                  {/* @ts-ignore */}
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    {/* @ts-ignore */}
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    {/* @ts-ignore */}
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    {/* @ts-ignore */}
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    {/* @ts-ignore */}
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <Text style={styles.googleButtonText}>Continuar con Google</Text>
                </>
              )}
            </TouchableOpacity>
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
  eyeIcon: { fontSize: 16 },
  errorText: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12,
    color: colors.error.text,
  },
  primaryButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
    height: controlSize.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  disabled: { opacity: 0.5 },
  primaryButtonText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.surface,
    fontSize: 16,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderDefault },
  dividerText: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[400] },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    height: controlSize.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  googleButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: colors.ink[900] },
  footerNote: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[300], textAlign: 'center' },
  linkButton: { alignItems: 'center', paddingVertical: spacing[2] },
  linkText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500] },
  linkBold: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.ink[900] },
});
