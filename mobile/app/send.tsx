import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { useFlowGuard } from '../src/hooks/useFlowGuard';
import { MIN_CHARS } from '../src/constants';
import { routes } from '../src/routes';
import { colors, spacing } from '../src/theme';
import { hebrewText } from '../src/typography';

export default function SendScreen() {
  const { draft } = useApp();
  const { blocked } = useFlowGuard({ requireQuota: true });

  if (blocked) return null;

  const send = () => {
    if (!draft.intention || !draft.content || draft.content.length < MIN_CHARS) {
      Alert.alert('שגיאה', 'חסרים פרטים לשליחה.');
      router.replace(routes.intention);
      return;
    }
    router.push(routes.queue);
  };

  return (
    <Screen scroll>
      <View style={styles.center}>
        <EnvelopeOrb mode="locked" />
      </View>
      <Title>{copy.sendTitle}</Title>
      <Subtitle>{copy.sendHint}</Subtitle>
      <GlassCard>
        <Text style={styles.warn}>{copy.sendWarn}</Text>
      </GlassCard>
      <PrimaryButton label={copy.sendCta} onPress={send} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginBottom: spacing.sm },
  warn: { color: colors.warning, lineHeight: 22, fontSize: 14, alignSelf: 'stretch', ...hebrewText },
});
