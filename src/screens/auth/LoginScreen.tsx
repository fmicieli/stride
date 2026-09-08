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
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.ink[400]} />
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
  forgotLink: { alignSelf: 'flex-start', paddingVertical: 4 },
  forgotText: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 14,
    color: colors.brand[500],
  },
  ctaSpacing: { marginTop: spacing[2] },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderDefault },
  dividerText: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[400] },
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
