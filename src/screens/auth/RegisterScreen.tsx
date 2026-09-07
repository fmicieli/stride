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
import { registerWithEmail } from '../../services/auth';
import { saveUserProfile, savePlan } from '../../services/firestore';
import { useOnboarding } from '../../utils/onboardingContext';

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
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);

  const emailError =
    touched.email && email.length > 0 && !isValidEmail(email)
      ? 'Ingresá un email válido'
      : null;

  const passwordError =
    touched.password && password.length > 0 && password.length < 8
      ? 'La contraseña debe tener al menos 8 caracteres'
      : null;

  const confirmError =
    touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword
      ? 'Las contraseñas no coinciden'
      : null;

  const hasErrors =
    !name.trim() ||
    !email.trim() ||
    !isValidEmail(email) ||
    password.length < 8 ||
    password !== confirmPassword;

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
        e.code === 'auth/email-already-in-use'
          ? 'Ese email ya está registrado'
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear cuenta</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            <Text style={styles.socialIcon}></Text>
            <Text style={styles.socialButtonText}>Continuar con Apple</Text>
          </TouchableOpacity>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor="#AAAAAA"
              autoCapitalize="words"
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor="#AAAAAA"
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
                placeholderTextColor="#AAAAAA"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
              >
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
                placeholderTextColor="#AAAAAA"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (hasErrors || loading) && styles.primaryButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              {'¿Ya tenés cuenta? '}<Text style={styles.linkBold}>Iniciá sesión</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PlanGenerated')}
          >
            <Text style={styles.skipText}>⚡ Modo prueba — saltear registro</Text>
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#111111',
    fontWeight: '400',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
    paddingTop: 8,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 10,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111111',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    fontSize: 13,
    color: '#999999',
    marginHorizontal: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E53935',
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  linkBold: {
    color: '#111111',
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontSize: 12,
    color: '#BBBBBB',
  },
});
