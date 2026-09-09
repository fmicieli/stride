import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { saveUserProfile } from '../../services/firestore';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const initial = (name || 'R').charAt(0).toUpperCase();

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      await saveUserProfile(user.uid, { name: name.trim(), lastName: lastName.trim(), email: email.trim() });
      await refreshProfile();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intentá de nuevo');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={22} color={colors.ink[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor={colors.ink[300]} autoCapitalize="words" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apellido</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Tu apellido" placeholderTextColor={colors.ink[300]} autoCapitalize="words" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor={colors.ink[300]} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={saving ? 'Guardando...' : 'Guardar cambios'}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, color: colors.ink[900] },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[6], paddingBottom: spacing[6], gap: spacing[5] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], borderTopWidth: 1, borderTopColor: colors.surfaceMuted, backgroundColor: colors.surface },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 32, color: colors.brand[600] },
  inputGroup: { gap: spacing[2] },
  inputLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: colors.ink[700] },
  input: { borderWidth: 1.5, borderColor: colors.borderDefault, borderRadius: radius.sm, height: controlSize.md, paddingHorizontal: spacing[3], fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[900], backgroundColor: colors.surface },
});
