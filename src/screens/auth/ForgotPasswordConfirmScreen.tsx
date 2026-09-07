import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';

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
          {'Te enviamos un link para resetear tu contraseña a '}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  emailHighlight: {
    color: '#111111',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
