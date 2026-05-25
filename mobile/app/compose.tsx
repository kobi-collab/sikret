import { router } from 'expo-router';
import { MAX_CHARS, MIN_CHARS } from '../src/constants';
import { Screen } from '../src/components/Screen';
import { EnvelopeInput, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../src/theme';

export default function ComposeScreen() {
  const { draft, setDraft } = useApp();
  const len = draft.content?.length ?? 0;
  const valid = len >= MIN_CHARS && len <= MAX_CHARS;

  return (
    <Screen scroll>
      <Title>{copy.composeTitle}</Title>
      <Subtitle>{copy.composeHint}</Subtitle>
      <EnvelopeInput
        value={draft.content ?? ''}
        onChangeText={(t) => setDraft({ content: t })}
        placeholder={copy.composePlaceholder}
        maxLength={MAX_CHARS}
      />
      <Text style={[styles.counter, len < MIN_CHARS && styles.counterWarn]}>
        {len} / {MAX_CHARS}
      </Text>
      <PrimaryButton label="המשך" disabled={!valid} onPress={() => router.push('/send')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: { color: colors.textMuted, textAlign: 'left', marginTop: 8, fontSize: 13 },
  counterWarn: { color: colors.warning },
});
