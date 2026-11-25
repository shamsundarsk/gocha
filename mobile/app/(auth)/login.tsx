import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      Toast.show({ type: 'error', text1: 'Enter a valid email address.' });
      return;
    }
    if (!password) {
      Toast.show({ type: 'error', text1: 'Enter your password.' });
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Could not sign you in.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color={Colors.text.secondary} />
              </Pressable>
              <View style={styles.brandMark}>
                <Text style={styles.brandLetter}>g</Text>
              </View>
            </View>

            <View style={styles.intro}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Your day is still on track. Pick up where you left off.</Text>
            </View>

            <View style={styles.form}>
              <Field
                id="email"
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                focused={focused === 'email'}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
              <Field
                id="password"
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                focused={focused === 'password'}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                accessory={
                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.text.tertiary}
                    />
                  </Pressable>
                }
              />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
                pressed && !loading && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Sign in</Text>
                  <Ionicons name="arrow-forward" size={19} color={Colors.white} />
                </>
              )}
            </Pressable>

            <View style={styles.helperCard}>
              <View style={styles.helperIcon}>
                <Ionicons name="flask-outline" size={18} color={Colors.accent.amber} />
              </View>
              <View style={styles.helperCopy}>
                <Text style={styles.helperTitle}>New to Gocha?</Text>
                <Text style={styles.helperText}>
                  Sample data is enabled by default, so you can explore before connecting your own context.
                </Text>
              </View>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>New here?</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              onPress={() => router.replace('/(auth)/register')}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type FieldProps = Pick<TextInputProps, 'autoCapitalize' | 'autoComplete' | 'textContentType'> & {
  id: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: IconName;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean;
  accessory?: React.ReactNode;
};

function Field({
  id,
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  secureTextEntry,
  focused,
  onFocus,
  onBlur,
  accessory,
  ...textInputProps
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
        <Ionicons
          name={icon}
          size={19}
          color={focused ? Colors.brand.secondary : Colors.text.tertiary}
        />
        <TextInput
          {...textInputProps}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          selectionColor={Colors.brand.secondary}
          style={styles.input}
        />
        {accessory}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['3xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white },
  intro: { marginBottom: Spacing['2xl'] },
  title: {
    fontSize: 34,
    lineHeight: 34 * 1.15,
    color: Colors.text.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.6,
    marginBottom: Spacing.sm,
  },
  subtitle: { fontSize: 17, color: Colors.text.secondary, lineHeight: 23 },
  form: { gap: Spacing.base, marginBottom: Spacing.xl },
  field: { gap: 7 },
  label: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontWeight: FontWeight.semibold,
    marginLeft: 2,
  },
  inputShell: {
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.bg.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  inputShellFocused: {
    borderColor: Colors.brand.secondary,
    backgroundColor: Colors.bg.elevated,
  },
  input: {
    flex: 1,
    height: 50,
    paddingVertical: 0,
    fontSize: 17,
    color: Colors.text.primary,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonDisabled: { opacity: 0.58 },
  primaryButtonText: { fontSize: 17, color: Colors.white, fontWeight: FontWeight.bold },
  helperCard: {
    marginTop: Spacing.lg,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bg.card,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  helperIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent.amber + '16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperCopy: { flex: 1 },
  helperTitle: { fontSize: 15, color: Colors.text.primary, fontWeight: FontWeight.semibold },
  helperText: { fontSize: 13, color: Colors.text.tertiary, lineHeight: 18, marginTop: 3 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.base,
  },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },
  dividerText: { fontSize: 13, color: Colors.text.tertiary },
  secondaryButton: {
    minHeight: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 17, color: Colors.text.secondary, fontWeight: FontWeight.semibold },
  pressed: { opacity: 0.72 },
});
