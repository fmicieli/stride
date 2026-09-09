import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { colors, spacing, radius } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** When false, hides the ✕ and disables backdrop-tap dismiss (forced choice). */
  dismissible?: boolean;
  /** Scroll the body content; pair with `footer` to keep an action pinned. */
  scrollBody?: boolean;
  /** Pinned below the (optionally scrolling) body — always visible. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * App-wide popup surface: slides up from the bottom, rounded top corners,
 * scrim behind, ✕ top-right, tap-outside to dismiss.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  dismissible = true,
  scrollBody = false,
  footer,
  children,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismissible ? onClose : undefined}
        />
        <View style={styles.sheet}>
          {dismissible && (
            <TouchableOpacity
              style={styles.close}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Icon name="close" size={22} color={colors.ink[500]} />
            </TouchableOpacity>
          )}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {scrollBody ? (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[3],
    maxHeight: '86%',
  },
  close: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink[900],
    paddingRight: spacing[8],
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink[500],
  },
  body: { gap: spacing[3], marginTop: spacing[1] },
  scrollBody: { flexShrink: 1, marginTop: spacing[1] },
  scrollBodyContent: { paddingBottom: spacing[2] },
  footer: { paddingTop: spacing[3] },
});
