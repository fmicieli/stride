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
import { loginWithEmail, signInWithGoogle } from '../../services/auth';
import { savePlan, saveUserProfile, getPlan } from '../../services/firestore';
import { useOnboarding } from '../../utils/onboardingContext';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { pendingPlan, reset: resetOnboarding } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    setLoading(true);
    try {
      const { user: loggedUser } = await loginWithEmail(email.trim(), password);
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
      const msg =
        e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password'
          ? 'Email o contraseña incorrectos'
          : e.code === 'auth/invalid-email'
          ? 'Email inválido'
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
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.ink[300]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.ink[300]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabled]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
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
              onPress={handleGoogleLogin}
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

          <TouchableOpacity style={styles.linkButton} activeOpacity={0.7} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              {'¿No tenés cuenta? '}<Text style={styles.linkBold}>Registrate</Text>
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
  header: { paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[1] },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: colors.ink[900] },
  scrollContent: { paddingHorizontal: spacing[4], paddingBottom: spacing[8], gap: spacing[4] },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink[900],
    marginTop: spacing[2],
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink[500],
    marginBottom: spacing[2],
  },
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
  passwordInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    color: colors.ink[900],
  },
  eyeButton: { padding: 4 },
  eyeIcon: { fontSize: 16 },
  forgotLink: { alignSelf: 'flex-start', paddingVertical: 4 },
  forgotText: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 14,
    color: colors.brand[500],
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
  linkButton: { alignItems: 'center', paddingVertical: spacing[2] },
  linkText: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 14,
    color: colors.ink[500],
  },
  linkBold: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.ink[900],
  },
});
