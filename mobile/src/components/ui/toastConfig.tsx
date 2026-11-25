import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Colors, FontSize, FontWeight, Radius } from '@/constants/theme';

const baseStyle = {
  borderLeftWidth: 0,
  borderRadius: Radius.lg,
  backgroundColor: Colors.bg.elevated,
  borderWidth: 1,
  borderColor: Colors.bg.cardBorder,
  minHeight: 58,
  paddingHorizontal: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 18,
  elevation: 10,
};

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[baseStyle, { borderColor: Colors.accent.teal + '38' }]}
      contentContainerStyle={styles.content}
      text1Style={styles.title}
      text2Style={styles.subtitle}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[baseStyle, { borderColor: Colors.error + '38' }]}
      contentContainerStyle={styles.content}
      text1Style={styles.title}
      text2Style={styles.subtitle}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[baseStyle, { borderColor: Colors.brand.primary + '38' }]}
      contentContainerStyle={styles.content}
      text1Style={styles.title}
      text2Style={styles.subtitle}
    />
  ),
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 6 },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
});
