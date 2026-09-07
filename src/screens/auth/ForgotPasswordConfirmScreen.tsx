import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'ForgotPasswordConfirm'>;
type Route = RouteProp<RootStackParamList, 'ForgotPasswordConfirm'>;

export function ForgotPasswordConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉</Text>
        </View>
        <Text style={styles.title}>Revisá tu email</Text>
        <Text style={styles.description}>
          {'Te enviamos un link a '}<Text style={styles.emailHighlight}>{email}</Text>
        </Text>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, paddingHorizontal: spacing[4], alignItems: 'center', justifyContent: 'center', gap: spacing[5], paddingBottom: spacing[10] },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: spacing[2] },
  icon: { fontSize: 36 },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, lineHeight: 30, color: colors.ink[900], textAlign: 'center' },
  description: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: colors.ink[500], textAlign: 'center', paddingHorizontal: spacing[4] },
  emailHighlight: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.ink[900] },
  primaryButton: { backgroundColor: colors.brand[500], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', marginTop: spacing[3] },
  primaryButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 16 },
});
