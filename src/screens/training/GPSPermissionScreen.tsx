import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'GPSPermission'>;

export function GPSPermissionScreen() {
  const navigation = useNavigation<Nav>();
  const [denied, setDenied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) { setDenied(true); return; }
        navigator.geolocation.getCurrentPosition(
          () => navigation.replace('ActiveTraining'),
          () => setDenied(true),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      } else {
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') navigation.replace('ActiveTraining');
        else setDenied(true);
      }
    } catch { setDenied(true); }
    finally { setRequesting(false); }
  };

  if (denied) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <Text style={styles.icon}>🚫</Text>
          <Text style={styles.title}>Acceso al GPS bloqueado</Text>
          <Text style={styles.bodyText}>
            {'Para registrar tus entrenamientos necesitamos acceso a tu ubicación.\n\nAndá a Configuración → Stride → Ubicación y habilitá el acceso.'}
          </Text>
        </View>
        <View style={styles.footer}>
          <Button label="Ir a Configuración" onPress={() => Linking.openSettings()} />
          <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Necesitamos tu ubicación</Text>
        <Text style={styles.bodyText}>
          Para rastrear tus entrenamientos en tiempo real y calcular tu distancia y pace, necesitamos acceso a tu ubicación mientras corrés.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button
          label={requesting ? 'Solicitando...' : 'Permitir acceso'}
          onPress={handleAllow}
          loading={requesting}
        />
        <Button label="Ahora no" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4], gap: spacing[4] },
  icon: { fontSize: 64, marginBottom: 8 },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900], textAlign: 'center' },
  bodyText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500], textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], gap: spacing[3], backgroundColor: colors.surface },
});
