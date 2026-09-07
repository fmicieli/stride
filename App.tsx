import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { OnboardingProvider } from './src/utils/onboardingContext';
import { AppNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
