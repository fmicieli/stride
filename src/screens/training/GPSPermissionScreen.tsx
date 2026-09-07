import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../navigation';

type Nav = StackNavigationProp<RootStackParamList, 'GPSPermission'>;

export function GPSPermissionScreen() {
  const navigation = useNavigation<Nav>();
  const [denied, setDenied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        navigation.replace('ActiveTraining');
      } else {
        setDenied(true);
      }
    } finally {
      setRequesting(false);
    }
  };

  if (denied) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Text style={styles.icon}>🚫</Text>
          <Text style={styles.title}>Acceso al GPS bloqueado</Text>
          <Text style={styles.body}>
            Para poder registrar tus entrenamientos necesitamos acceso a tu ubicación.
            {'\n\n'}
            Andá a Configuración → Stride → Ubicación y habilitá el acceso.
          </Text>
          <View style={styles.buttonArea}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.primaryButtonText}>Ir a Configuración</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
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
          Para rastrear tus entrenamientos en tiempo real y calcular tu distancia y pace,
          necesitamos acceso a tu ubicación mientras corrés.
        </Text>

        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={[styles.primaryButton, requesting && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleAllow}
            disabled={requesting}
          >
            <Text style={styles.primaryButtonText}>
              {requesting ? 'Solicitando...' : 'Permitir acceso'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Ahora no</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  buttonArea: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 16,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#666666',
  },
});
