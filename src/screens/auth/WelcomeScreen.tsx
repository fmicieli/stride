import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { StrideLogo } from '../../components/StrideLogo';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <StrideLogo width={180} />
      </View>

      <View style={styles.footer}>
        <Button label="Empezar" onPress={() => navigation.navigate('OnboardingGoal')} />
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[3],
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: colors.ink[600],
  },
});
