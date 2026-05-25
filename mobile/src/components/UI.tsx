import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme';

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: string }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function GlassCard({
  children,
  selected,
  onPress,
  style,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const inner = (
    <View style={[styles.card, selected && styles.cardSelected, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btnWrap, (pressed || disabled) && { opacity: disabled ? 0.4 : 0.85 }]}
    >
      <LinearGradient
        colors={[colors.neonCyan, colors.neonPurple, colors.neonMagenta]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btnGradient}
      >
        <Text style={styles.btnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outline,
        danger && styles.outlineDanger,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.outlineText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

export function EnvelopeInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, props.style]}
      multiline
      textAlignVertical="top"
      textAlign="right"
    />
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(45, 226, 230, 0.15)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.neonMagenta,
    shadowColor: colors.neonMagenta,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  btnWrap: {
    borderRadius: radii.button,
    marginTop: spacing.md,
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  btnGradient: {
    borderRadius: radii.button,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnText: {
    color: colors.bgVoid,
    fontSize: 17,
    fontWeight: '700',
  },
  outline: {
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: 'rgba(45, 226, 230, 0.5)',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  outlineDanger: {
    borderColor: 'rgba(255, 77, 109, 0.6)',
  },
  outlineText: {
    color: colors.neonCyan,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bgDeep,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(123, 47, 247, 0.35)',
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    padding: spacing.md,
    textAlign: 'right',
  },
});
