import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { LogrosScreen } from '../screens/LogrosScreen';

// Training
import { ActiveTrainingScreen } from '../screens/training/ActiveTrainingScreen';
import { TrainingCompletedScreen } from '../screens/training/TrainingCompletedScreen';

// Profile
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { HistorialScreen } from '../screens/profile/HistorialScreen';

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
  ActiveTraining: { resume?: boolean } | undefined;
  TrainingCompleted: { sessionId: string };
  // Profile
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Historial: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Room for icon + label; the device's bottom inset is reserved on top of this.
const TAB_BAR_CONTENT_HEIGHT = 76;

// Hoy / Progreso / Logros got the dark glass redesign; Perfil stays on the
// original light theme, so it gets its own tab bar treatment below.
const DARK_ACCENT = '#8FE05A';
const DARK_INACTIVE = '#9A9A9F';

function MainTabs() {
  const insets = useSafeAreaInsets();
  const baseTabBarStyle = {
    height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
    paddingTop: 10,
    paddingBottom: 12 + insets.bottom,
    paddingHorizontal: 16,
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            activeColor={DARK_ACCENT}
            inactiveColor={DARK_INACTIVE}
          />
        ),
        tabBarActiveTintColor: DARK_ACCENT,
        tabBarInactiveTintColor: DARK_INACTIVE,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
        // Constant content room (icon + label) with the device's bottom inset
        // reserved underneath, so nothing clips on any screen height.
        // Matches the Figma "glass" tab bar: translucent dark fill, blurred
        // backdrop (web), top border and a soft shadow lifting it upward.
        tabBarStyle: {
          ...baseTabBarStyle,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.10)',
          backgroundColor: 'rgba(10,10,12,0.88)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
          ...(Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any)
            : null),
        },
      })}
    >
      <Tab.Screen name="Hoy" component={HomeScreen} />
      <Tab.Screen name="Progreso" component={ProgressScreen} />
      <Tab.Screen name="Logros" component={LogrosScreen} />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarActiveTintColor: '#1B6E52',
          tabBarInactiveTintColor: '#8A8A8A',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Perfil" focused={focused} activeColor="#1B6E52" inactiveColor="#8A8A8A" />
          ),
          tabBarStyle: {
            ...baseTabBarStyle,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            backgroundColor: '#FFFFFF',
          },
        }}
      />
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
