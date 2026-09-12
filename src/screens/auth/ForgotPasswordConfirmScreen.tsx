import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { Button } from '../../components/Button';
import { spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'ForgotPasswordConfirm'>;
type Route = RouteProp<RootStackParamList, 'ForgotPasswordConfirm'>;

const BG = '#0D0D0F';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#9A9A9F';
const ACCENT_BG = 'rgba(143,224,90,0.12)';

export function ForgotPasswordConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✉</Text>
          </View>
          <Text style={styles.title}>Revisá tu email</Text>
          <Text style={styles.description}>
            {'Te enviamos un link a '}<Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Button label="Volver al inicio" onPress={() => navigation.navigate('Welcome')} dark style={styles.cta} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing[4], alignItems: 'center', justifyContent: 'center', gap: spacing[5], paddingBottom: spacing[10] },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: ACCENT_BG, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[2] },
  icon: { fontSize: 36 },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, lineHeight: 30, color: TEXT, textAlign: 'center' },
  description: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: spacing[4] },
  emailHighlight: { fontFamily: 'PlusJakartaSans-SemiBold', color: TEXT },
  cta: { alignSelf: 'stretch', marginTop: spacing[3] },
});
