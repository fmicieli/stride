import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { sendPasswordReset } from '../../services/auth';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { DarkGlassBackground } from '../../components/DarkGlassBackground';
import { dg } from '../../components/darkGlassTokens';
import { spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Ingresá tu email'); return; }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      navigation.navigate('ForgotPasswordConfirm', { email: email.trim() });
    } catch (e: any) {
      const msg = e.code === 'auth/user-not-found' ? 'No encontramos una cuenta con ese email'
        : e.code === 'auth/invalid-email' ? 'Email inválido'
        : 'Ocurrió un error. Intentá de nuevo';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topLeft" glowSize={220} glowOpacity={0.16} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="chevron-left" size={22} color={dg.ink900} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recuperar contraseña</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.content}>
            <Text style={styles.description}>
              Ingresá tu email y te enviamos un link para restablecer tu contraseña.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, focused && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={dg.ink300}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
            <Button label={loading ? 'Enviando...' : 'Enviar link'} onPress={handleSend} loading={loading} dark />
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, color: dg.ink900 },
  content: { flex: 1, paddingHorizontal: spacing[4], paddingTop: spacing[4], gap: spacing[5] },
  description: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: dg.ink500 },
  inputGroup: { gap: spacing[2] },
  inputLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: dg.ink700 },
  input: {
    borderWidth: 1.5, borderColor: dg.border, borderRadius: radius.sm,
    height: controlSize.md, paddingHorizontal: spacing[3],
    fontFamily: 'PlusJakartaSans', fontSize: 15, color: dg.ink900,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputFocused: { borderColor: dg.accent },
});
