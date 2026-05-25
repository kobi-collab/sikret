import { router } from 'expo-router';
import { INTENTIONS } from '../src/constants';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../src/theme';

export default function IntentionScreen() {
  const { draft, setDraft } = useApp();

  return (
    <Screen scroll>
      <Title>{copy.intentionTitle}</Title>
      <Subtitle>{copy.intentionHint}</Subtitle>
      {INTENTIONS.map((item) => (
        <GlassCard
          key={item.id}
          selected={draft.intention === item.id}
          onPress={() => setDraft({ intention: item.id })}
        >
          <Text style={styles.row}>
            <Text style={styles.icon}>{item.icon} </Text>
            <Text style={styles.label}>{item.label}</Text>
          </Text>
        </GlassCard>
      ))}
      <PrimaryButton
        label="המשך"
        disabled={!draft.intention}
        onPress={() => router.push('/compose')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center' },
  icon: { color: colors.neonCyan, fontSize: 18 },
  label: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' },
});
