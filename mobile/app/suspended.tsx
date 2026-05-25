import { Screen } from '../src/components/Screen';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { OutlineButton, Subtitle, Title } from '../src/components/UI';
import { useApp } from '../src/context/AppContext';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../src/theme';

export default function SuspendedScreen() {
  const { me } = useApp();
  const until = me?.suspendedUntil
    ? new Date(me.suspendedUntil).toLocaleString('he-IL')
    : '';

  return (
    <Screen scroll>
      <EnvelopeOrb mode="locked" />
      <Title>החשבון הושעה זמנית</Title>
      <Subtitle>
        בגלל דיווחים על שימוש שלא לפי הכללים. ניתן לערער ב-support@sikret.app (החלף במייל אמיתי).
      </Subtitle>
      {until ? <Text style={styles.until}>עד: {until}</Text> : null}
      <OutlineButton label="חזרה" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  until: { color: colors.danger, textAlign: 'center', marginVertical: 16 },
});
