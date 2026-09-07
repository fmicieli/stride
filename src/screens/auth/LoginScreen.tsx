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
import { loginWithEmail } from '../../services/auth';
import { savePlan, saveUserProfile, getPlan } from '../../services/firestore';
import { useOnboarding } from '../../utils/onboardingContext';

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { pendingPlan, reset: resetOnboarding } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
        if (existingPlan) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('OnboardingGoal');
        }
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>Stride</Text>
          <Text style={styles.tagline}>Tu entrenamiento, a tu ritmo</Text>

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
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor="#AAAAAA"
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
                placeholderTextColor="#AAAAAA"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              {'¿No tenés cuenta? '}<Text style={styles.linkBold}>Registrate</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PlanGenerated')}
          >
            <Text style={styles.skipText}>⚡ Modo prueba — saltear login</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 2,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
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
    marginVertical: 4,
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
  forgotLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
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
    opacity: 0.6,
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
