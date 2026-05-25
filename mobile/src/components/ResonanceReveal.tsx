import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedbackResponse } from '../api';
import { copy } from '../copy';
import { colors, spacing } from '../theme';
import { ResonanceRing } from './ResonanceRing';
import { PrimaryButton } from './UI';

type Props = {
  visible: boolean;
  result: FeedbackResponse | null;
  onClose: () => void;
};

function feedbackPhrase(type: string | null) {
  if (type === 'touched') return 'נגע בו';
  if (type === 'dishonest') return 'הרגיש לא כנה';
  if (type === 'report') return 'דווח';
  return null;
}

export function ResonanceReveal({ visible, result, onClose }: Props) {
  if (!result) return null;

  const deltaText =
    result.resonanceDelta > 0
      ? `+${result.resonanceDelta.toFixed(1)}`
      : result.resonanceDelta < 0
        ? result.resonanceDelta.toFixed(1)
        : 'ללא שינוי';

  const fb = feedbackPhrase(result.envelopeFeedback);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{copy.revealTitle}</Text>
          <View style={styles.ringRow}>
            <ResonanceRing
              resonance={result.myResonance}
              size={96}
              showLabel={false}
            />
          </View>
          <Text style={styles.line}>{copy.revealResonance(result.myResonance, deltaText)}</Text>
          <Text style={styles.mystic}>
            {fb ? copy.swapYourSecretFeedback(fb) : copy.revealWaiting}
          </Text>
          {result.peerResonance != null ? (
            <Text style={styles.peer}>{copy.revealPeer(result.peerResonance)}</Text>
          ) : null}
          <PrimaryButton label={copy.revealContinue} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 15, 0.88)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(123, 47, 247, 0.35)',
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: colors.neonMagenta,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  ringRow: { marginVertical: spacing.sm },
  line: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  mystic: {
    color: colors.neonCyan,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  peer: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
