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
import { loginWithEmail, signInWithGoogle } from '../../services/auth';
import { savePlan, saveUserProfile, getPlan } from '../../services/firestore';
import { useOnboarding } from '../../utils/onboardingContext';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { GoogleGlyph } from '../../components/GoogleGlyph';
import { spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;

const BG = '#0D0D0F';
const INPUT_BG = '#1A1A1D';
const BORDER = 'rgba(255,255,255,0.10)';
const BORDER_FOCUS = '#8FE05A';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#9A9A9F';
const TEXT_DIM = '#6A6A6E';
const ACCENT = '#8FE05A';

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { pendingPlan, reset: resetOnboarding } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Inicia sesión</Text>
            <Text style={styles.subtitle}>Solo para guardar tu progreso. No pedimos tarjeta de crédito.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="tú@email.com"
                placeholderTextColor={TEXT_DIM}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={[styles.passwordRow, passwordFocused && styles.inputFocused]}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={TEXT_DIM}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <Button
              label={loading ? 'Ingresando...' : 'Ingresar'}
              onPress={handleLogin}
              loading={loading}
              dark
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
                onPress={handleGoogleLogin}
                dark
              />
            )}

            <TouchableOpacity style={styles.linkButton} activeOpacity={0.7} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>
                {'¿No tenés cuenta? '}<Text style={styles.linkBold}>Registrate</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[7], paddingBottom: spacing[8], gap: spacing[4] },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 28, lineHeight: 34, color: TEXT },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: TEXT_MUTED, marginTop: -spacing[2], marginBottom: spacing[2] },
  inputGroup: { gap: spacing[2] },
  inputLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: TEXT_MUTED },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: spacing[4],
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    color: TEXT,
    backgroundColor: INPUT_BG,
  },
  inputFocused: { borderColor: BORDER_FOCUS },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: spacing[4],
    backgroundColor: INPUT_BG,
  },
  passwordInput: { flex: 1, fontFamily: 'PlusJakartaSans', fontSize: 15, color: TEXT },
  eyeButton: { padding: 4 },
  forgotLink: { alignSelf: 'flex-end', paddingVertical: 4, marginTop: -spacing[2] },
  forgotText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: ACCENT },
  ctaSpacing: { marginTop: spacing[2] },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: TEXT_DIM },
  linkButton: { alignItems: 'center', paddingVertical: spacing[2] },
  linkText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: TEXT_MUTED },
  linkBold: { fontFamily: 'PlusJakartaSans-SemiBold', color: TEXT },
});
