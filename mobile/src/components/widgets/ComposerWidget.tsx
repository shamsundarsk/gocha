import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { Press } from '../ui/kit';
import * as Haptics from 'expo-haptics';

export interface QuickAction {
  label: string;
  text: string;
  icon: string;
}

export interface ComposerWidgetProps {
  value?: string;
  onChange?: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  quickActions?: QuickAction[];
  autoFocus?: boolean;
  style?: ViewStyle;
}

export function ComposerWidget({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'What needs doing?',
  quickActions = [
    { label: 'Run 5k', text: 'Run 5k in the park', icon: 'walk' },
    { label: 'Walk 20m', text: 'Walk for 20 minutes', icon: 'walk' },
    { label: 'Gym 45m', text: 'Gym for 45 minutes', icon: 'barbell' },
    { label: 'Groceries', text: 'Buy groceries', icon: 'cart' },
  ],
  autoFocus = false,
  style,
}: ComposerWidgetProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    const text = value.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSubmit?.(text);
    onChange?.('');
    if (Platform.OS === 'ios') {
      Keyboard.dismiss();
    }
    inputRef.current?.blur();
  };

  const handleQuickAction = (action: QuickAction) => {
    Haptics.selectionAsync().catch(() => {});
    onChange?.(action.text);
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.composer, focused && styles.composerFocused]}>
        <Ionicons
          name="add"
          size={20}
          color={focused ? Colors.brand.secondary : Colors.text.tertiary}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={(t) => onChange?.(t)}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          onFocus={() => {
            setFocused(true);
            setExpanded(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setExpanded(false), 200);
          }}
          multiline
          maxLength={400}
          accessibilityLabel="Add a task"
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={handleSubmit}
        />
        <Press
          onPress={handleSubmit}
          disabled={!value.trim()}
          style={[
            styles.sendBtn,
            { opacity: value.trim() ? 1 : 0.35 },
          ]}
          accessibilityLabel="Add task"
        >
          <Ionicons name="arrow-up" size={18} color={Colors.white} />
        </Press>
      </View>

      {expanded && quickActions.length > 0 && (
        <View style={styles.suggestions}>
          {quickActions.map((action) => (
            <Press
              key={action.label}
              style={styles.suggestion}
              onPress={() => handleQuickAction(action)}
              accessibilityLabel={action.label}
            >
              <Ionicons name={`${action.icon}-outline` as any} size={15} color={Colors.brand.secondary} />
              <Text style={styles.suggestionText}>{action.label}</Text>
            </Press>
          ))}
        </View>
      )}
    </View>
  );
}

export function InlineComposerWidget({
  onSubmit,
  placeholder = 'Add a task…',
  style,
}: {
  onSubmit: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    const t = text.trim();
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSubmit(t);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <Press onPress={handleSubmit} disabled={!text.trim()} style={style} accessibilityLabel="Add task">
      <View style={styles.inlineComposer}>
        <Ionicons
          name="add"
          size={18}
          color={text.trim() ? Colors.brand.secondary : Colors.text.tertiary}
        />
        <TextInput
          ref={inputRef}
          style={styles.inlineInput}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          blurOnSubmit={false}
          accessibilityLabel="Add a task"
        />
        {text.trim() && (
          <Ionicons name="arrow-up" size={16} color={Colors.brand.secondary} />
        )}
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  composerFocused: {
    borderColor: Colors.brand.secondary,
    backgroundColor: Colors.bg.elevated,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 17,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.fill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  inlineComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  inlineInput: {
    flex: 1,
    height: 36,
    fontSize: 15,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
});