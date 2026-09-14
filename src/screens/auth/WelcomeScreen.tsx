import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { StrideLogo } from '../../components/StrideLogo';
import { Button } from '../../components/Button';
import { dg } from '../../components/darkGlassTokens';
import { spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

const posterSource = require('../../../assets/welcome-hero.jpg');
const posterUri = typeof posterSource === 'string' ? posterSource : posterSource.uri;

const videoSource = require('../../../assets/welcome.mp4');
const videoUri = typeof videoSource === 'string' ? videoSource : videoSource.uri;

const VIDEO_START_SECONDS = 1;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerShift = useRef(new Animated.Value(10)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Fade the logo in right away, then — once its own spin/reveal entrance
    // has had time to play — fade in the buttons.
    Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: false }).start();

    const delay = Platform.OS === 'web' ? 1200 : 350;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(footerOpacity, { toValue: 1, duration: 380, useNativeDriver: false }),
        Animated.timing(footerShift, { toValue: 0, duration: 380, useNativeDriver: false }),
      ]).start();
    }, delay);
    // Safety net: if the animation loop is throttled (hidden tab), snap to the
    // final state so the logo/buttons are never left invisible.
    const settle = setTimeout(() => {
      logoOpacity.setValue(1);
      footerOpacity.setValue(1);
      footerShift.setValue(0);
    }, delay + 2200);
    return () => {
      clearTimeout(t);
      clearTimeout(settle);
    };
  }, []);

  // Native: skip the first second of the clip once it's loaded.
  const handleNativeVideoLoad = () => {
    videoRef.current?.setPositionAsync(VIDEO_START_SECONDS * 1000).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        {Platform.OS === 'web' ? (
          // @ts-ignore web-only <video>: autoplay muted loop, cropped to cover the hero area.
          // Plain inline style object — a raw DOM tag needs a real CSS object,
          // not a StyleSheet.create() reference (see OnboardingDateScreen's <input>).
          <video
            onLoadedMetadata={(e: any) => {
              // Start a bit into the clip instead of at its first frame.
              try { e.currentTarget.currentTime = VIDEO_START_SECONDS; } catch {}
            }}
            src={videoUri}
            poster={posterUri}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              // Slightly oversize so the blurred edges are cropped by the
              // hero's overflow:hidden instead of showing a soft halo.
              transform: 'scale(1.08)',
              filter: 'blur(3px)',
            }}
          />
        ) : (
          <Video
            ref={videoRef}
            source={videoSource}
            posterSource={posterSource}
            usePoster
            style={styles.heroImage}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            onLoad={handleNativeVideoLoad}
          />
        )}
        <View style={styles.heroOverlay} pointerEvents="none" />
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity }]}>
          <StrideLogo width={225} color="#FFFFFF" animated />
        </Animated.View>
        <View style={styles.fade} pointerEvents="none" />
      </View>

      <SafeAreaView style={styles.safeFooter} edges={['bottom']}>
        <Animated.View
          style={[styles.footer, { opacity: footerOpacity, transform: [{ translateY: footerShift }] }]}
        >
          <Button label="Continuar" dark onPress={() => navigation.navigate('OnboardingGoal')} />
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  hero: { flex: 1, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,12,0.45)' },
  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fade:
    Platform.OS === 'web'
      ? ({
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 110,
          backgroundImage: 'linear-gradient(to bottom, rgba(13,13,15,0), rgba(13,13,15,1))',
        } as any)
      : { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, backgroundColor: 'rgba(13,13,15,0.85)' },
  safeFooter: { backgroundColor: '#0D0D0F' },
  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[4],
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: dg.ink500,
  },
});
