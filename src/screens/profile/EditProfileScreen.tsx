import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { saveUserProfile } from '../../services/firestore';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { DarkGlassBackground } from '../../components/DarkGlassBackground';
import { dg } from '../../components/darkGlassTokens';
import { spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'EditProfile'>;

const BG = '#0D0D0F';
const INPUT_BG = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.16)';
const BORDER_FOCUS = dg.accent;
const TEXT = dg.ink900;
const TEXT_MUTED = dg.ink500;
const ACCENT = dg.accent;

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setAvatar(profile.avatar);
    }
  }, [profile]);

  const initial = (name || 'R').charAt(0).toUpperCase();
  const email = profile?.email || user?.email || '';

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      await saveUserProfile(user.uid, {
        name: name.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        ...(avatar !== profile?.avatar ? { avatar } : {}),
      });
      await refreshProfile();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intentá de nuevo');
    } finally { setSaving(false); }
  };

  const focusBorder = (field: string) => focused === field ? { borderColor: BORDER_FOCUS } : null;

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevron-left" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Avatar con botón de cámara */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.8}>
                {avatar
                  ? <Image source={{ uri: avatar }} style={styles.avatarImg} />
                  : <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                }
                <View style={styles.cameraBadge}>
                  <Icon name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={[styles.input, focusBorder('name')]}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="words"
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
            </View>

            {/* Apellido */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={[styles.input, focusBorder('lastName')]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Tu apellido"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="words"
                onFocus={() => setFocused('lastName')}
                onBlur={() => setFocused(null)}
              />
            </View>

            {/* Email — deshabilitado */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText} numberOfLines={1}>{email}</Text>
              </View>
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono celular</Text>
              <TextInput
                style={[styles.input, focusBorder('phone')]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Tu número de celular"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="phone-pad"
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
              />
            </View>

          </ScrollView>

          <View style={styles.footer}>
            <Button label={saving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} disabled={saving} loading={saving} dark />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, color: TEXT },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[6], paddingBottom: spacing[6], gap: spacing[5] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[7] },

  avatarSection: { alignItems: 'center' },
  avatarWrap: { position: 'relative', width: 88, height: 88 },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(143,224,90,0.14)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 32, color: ACCENT },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG,
  },

  inputGroup: { gap: spacing[2] },
  inputLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: TEXT_MUTED },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: radius.sm, height: controlSize.md, paddingHorizontal: spacing[3], fontFamily: 'PlusJakartaSans', fontSize: 15, color: TEXT, backgroundColor: INPUT_BG },
  inputDisabled: { borderWidth: 1, borderColor: BORDER, borderRadius: radius.sm, height: controlSize.md, paddingHorizontal: spacing[3], backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center' },
  inputDisabledText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: TEXT_MUTED },
});
