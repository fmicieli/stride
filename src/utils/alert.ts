import { Alert, Platform } from 'react-native';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform Alert.alert — react-native-web's Alert.alert is a no-op, so
 * on web this falls back to window.alert/confirm instead of silently doing
 * nothing. Same call shape as Alert.alert (title, message, buttons).
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const confirmBtn = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  if (window.confirm(text)) {
    confirmBtn.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
