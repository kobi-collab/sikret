import { router } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';
import { MAX_CHARS, MIN_CHARS } from '../src/constants';
import { Screen } from '../src/components/Screen';
import { EnvelopeInput, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { filterMessage, filterSecretContent } from '../src/moderation/filter';
import { colors } from '../src/theme';

export default function ComposeScreen() {
  const { draft, setDraft } = useApp();
  const len = draft.content?.length ?? 0;
  const valid = len >= MIN_CHARS && len <= MAX_CHARS;

  const continueNext = () => {
    const content = draft.content ?? '';
    const result = filterSecretContent(content);
    if (!result.ok) {
      Alert.alert('לא ניתן לשלוח', filterMessage(result));
      return;
    }
    router.push('/send');
  };

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
      <PrimaryButton label="המשך" disabled={!valid} onPress={continueNext} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: { color: colors.textMuted, textAlign: 'left', marginTop: 8, fontSize: 13 },
  counterWarn: { color: colors.warning },
});
