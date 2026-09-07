import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../navigation';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'GPSPermission'>;

export function GPSPermissionScreen() {
  const navigation = useNavigation<Nav>();
  const [denied, setDenied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') { navigation.replace('ActiveTraining'); }
      else { setDenied(true); }
    } finally { setRequesting(false); }
  };

  if (denied) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Text style={styles.icon}>🚫</Text>
          <Text style={styles.title}>Acceso al GPS bloqueado</Text>
          <Text style={styles.body}>
            {'Para registrar tus entrenamientos necesitamos acceso a tu ubicación.\n\nAndá a Configuración → Stride → Ubicación y habilitá el acceso.'}
          </Text>
          <View style={styles.buttonArea}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => Linking.openSettings()}>
              <Text style={styles.primaryButtonText}>Ir a Configuración</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Necesitamos tu ubicación</Text>
        <Text style={styles.body}>
          Para rastrear tus entrenamientos en tiempo real y calcular tu distancia y pace, necesitamos acceso a tu ubicación mientras corrés.
        </Text>
        <View style={styles.buttonArea}>
          <TouchableOpacity style={[styles.primaryButton, requesting && styles.disabled]} activeOpacity={0.8} onPress={handleAllow} disabled={requesting}>
            <Text style={styles.primaryButtonText}>{requesting ? 'Solicitando...' : 'Permitir acceso'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryButtonText}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4], gap: spacing[4], paddingBottom: spacing[6] },
  icon: { fontSize: 64, marginBottom: 8 },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900], textAlign: 'center' },
  body: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500], textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  buttonArea: { alignSelf: 'stretch', gap: spacing[3], marginTop: spacing[4] },
  primaryButton: { backgroundColor: colors.brand[500], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 16 },
  disabled: { opacity: 0.6 },
  secondaryButton: { height: controlSize.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500] },
});
