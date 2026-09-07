import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.logoSection}>
          <Text style={styles.logo}>Stride</Text>
          <Text style={styles.tagline}>Tu entrenamiento, a tu ritmo</Text>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('OnboardingGoal')}
          >
            <Text style={styles.primaryButtonText}>Empezar</Text>
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
        </View>
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
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 24,
  },
  logoSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  actionsSection: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
});
