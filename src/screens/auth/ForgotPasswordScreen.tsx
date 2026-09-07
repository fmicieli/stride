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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { sendPasswordReset } from '../../services/auth';

type Nav = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Ingresá tu email');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      navigation.navigate('ForgotPasswordConfirm', { email: email.trim() });
    } catch (e: any) {
      const msg =
        e.code === 'auth/user-not-found'
          ? 'No encontramos una cuenta con ese email'
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
          <Text style={styles.headerTitle}>¿Olvidaste tu contraseña?</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Ingresá tu email y te enviamos un link para que puedas restablecer tu contraseña.
          </Text>

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

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  description: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
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
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
