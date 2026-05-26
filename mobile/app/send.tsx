import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { colors, spacing } from '../src/theme';
import { hebrewText } from '../src/typography';

export default function SendScreen() {
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
      <PrimaryButton label={copy.sendCta} onPress={() => router.push('/queue')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginBottom: spacing.sm },
  warn: { color: colors.warning, lineHeight: 22, fontSize: 14, alignSelf: 'stretch', ...hebrewText },
});
