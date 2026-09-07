import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
import { OnboardingDateScreen } from '../screens/onboarding/OnboardingDateScreen';
import { InsufficientTimeScreen } from '../screens/onboarding/InsufficientTimeScreen';
import { PlanLoadingScreen } from '../screens/PlanLoadingScreen';
import { PlanGeneratedScreen } from '../screens/PlanGeneratedScreen';

// Main tabs
import { HomeScreen } from '../screens/HomeScreen';
import { MyPlanScreen } from '../screens/MyPlanScreen';
import { ProgressScreen } from '../screens/progress/ProgressScreen';

// Training
import { GPSPermissionScreen } from '../screens/training/GPSPermissionScreen';
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
  OnboardingDate: undefined;
  InsufficientTime: undefined;
  PlanLoading: undefined;
  PlanGenerated: { plan?: TrainingPlan } | undefined;
  // Main
  MainTabs: undefined;
  // Training
  GPSPermission: undefined;
  ActiveTraining: undefined;
  TrainingCompleted: { sessionId: string };
  // Profile
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Historial: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { Inicio: '⊙', 'Mi plan': '≡', Progreso: '◎' };
  return (
    <Text style={{ fontSize: 20, color: focused ? '#111111' : '#BBBBBB' }}>
      {icons[name] ?? '•'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#BBBBBB',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          backgroundColor: '#FFFFFF',
          height: 60,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Mi plan" component={MyPlanScreen} />
      <Tab.Screen name="Progreso" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

function SplashView() {
  const sOpacity = useRef(new Animated.Value(0)).current;
  const sRotation = useRef(new Animated.Value(0)).current;
  const restOpacity = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(sOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(sRotation, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(restOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(splashOpacity, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();
  }, []);

  const rotate = sRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.splash, { opacity: splashOpacity }]}>
      <View style={styles.logoRow}>
        <Animated.Text style={[styles.logoS, { opacity: sOpacity, transform: [{ rotate }] }]}>
          S
        </Animated.Text>
        <Animated.Text style={[styles.logoRest, { opacity: restOpacity }]}>
          tride
        </Animated.Text>
      </View>
      <Animated.Text style={[styles.splashTagline, { opacity: restOpacity }]}>
        Tu entrenamiento, a tu ritmo
      </Animated.Text>
    </Animated.View>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2650);
    return () => clearTimeout(t);
  }, []);

  if (!splashDone || loading) {
    return <SplashView />;
  }

  const initialRoute: keyof RootStackParamList = user ? 'MainTabs' : 'OnboardingGoal';

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
        <Stack.Screen name="OnboardingDate" component={OnboardingDateScreen} />
        <Stack.Screen name="InsufficientTime" component={InsufficientTimeScreen} />
        <Stack.Screen name="PlanLoading" component={PlanLoadingScreen} />
        <Stack.Screen name="PlanGenerated" component={PlanGeneratedScreen} />

        {/* App */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="GPSPermission" component={GPSPermissionScreen} />
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoS: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111111',
  },
  logoRest: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111111',
  },
  splashTagline: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
});
