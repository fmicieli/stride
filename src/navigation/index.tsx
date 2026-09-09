import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TabIcon } from '../components/TabIcon';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TrainingPlan } from '../types';

import { useAuth } from '../context/AuthContext';

// Auth
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ForgotPasswordConfirmScreen } from '../screens/auth/ForgotPasswordConfirmScreen';

// Onboarding
import { OnboardingGoalScreen } from '../screens/onboarding/OnboardingGoalScreen';
import { OnboardingLevelScreen } from '../screens/onboarding/OnboardingLevelScreen';
import { OnboardingDaysScreen } from '../screens/onboarding/OnboardingDaysScreen';
import { OnboardingProjectionScreen } from '../screens/onboarding/OnboardingProjectionScreen';
import { OnboardingDateScreen } from '../screens/onboarding/OnboardingDateScreen';
import { InsufficientTimeScreen } from '../screens/onboarding/InsufficientTimeScreen';
import { PlanLoadingScreen } from '../screens/PlanLoadingScreen';

// Main tabs
import { HomeScreen } from '../screens/HomeScreen';
import { MyPlanScreen } from '../screens/MyPlanScreen';
import { ProgressScreen } from '../screens/progress/ProgressScreen';

// Training
import { ActiveTrainingScreen } from '../screens/training/ActiveTrainingScreen';
import { TrainingCompletedScreen } from '../screens/training/TrainingCompletedScreen';

// Profile
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { HistorialScreen } from '../screens/profile/HistorialScreen';
import { LogrosScreen } from '../screens/profile/LogrosScreen';

export type RootStackParamList = {
  // Auth
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ForgotPasswordConfirm: { email: string };
  // Onboarding (accessible without auth)
  OnboardingGoal: undefined;
  OnboardingLevel: undefined;
  OnboardingDays: undefined;
  OnboardingProjection: undefined;
  OnboardingDate: undefined;
  InsufficientTime: undefined;
  PlanLoading: undefined;
  PlanGenerated: { plan?: TrainingPlan } | undefined;
  // Main
  MainTabs: undefined;
  MyPlan: undefined;
  // Training
  ActiveTraining: undefined;
  TrainingCompleted: { sessionId: string };
  // Profile
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Historial: undefined;
  Logros: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            activeColor="#1B6E52"
            inactiveColor="#8A8A8A"
          />
        ),
        tabBarActiveTintColor: '#1B6E52',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          backgroundColor: '#FFFFFF',
          height: 76,
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 16,
        },
      })}
    >
      <Tab.Screen name="Hoy" component={HomeScreen} />
      <Tab.Screen name="Progreso" component={ProgressScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  // Blank while auth resolves; the entrance animation lives on the first screen.
  if (loading) {
    return <View style={styles.splash} />;
  }

  const initialRoute: keyof RootStackParamList = user ? 'MainTabs' : 'Welcome';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'none' }}
      >
        {/* Auth */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ForgotPasswordConfirm" component={ForgotPasswordConfirmScreen} />

        {/* Onboarding - accessible without auth */}
        <Stack.Screen name="OnboardingGoal" component={OnboardingGoalScreen} />
        <Stack.Screen name="OnboardingLevel" component={OnboardingLevelScreen} />
        <Stack.Screen name="OnboardingDays" component={OnboardingDaysScreen} />
        <Stack.Screen name="OnboardingProjection" component={OnboardingProjectionScreen} />
        <Stack.Screen name="OnboardingDate" component={OnboardingDateScreen} />
        <Stack.Screen name="InsufficientTime" component={InsufficientTimeScreen} />
        <Stack.Screen name="PlanLoading" component={PlanLoadingScreen} />

        {/* App */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MyPlan" component={MyPlanScreen} />
        <Stack.Screen name="ActiveTraining" component={ActiveTrainingScreen} />
        <Stack.Screen name="TrainingCompleted" component={TrainingCompletedScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Historial" component={HistorialScreen} />
        <Stack.Screen name="Logros" component={LogrosScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
