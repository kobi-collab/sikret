import { Linking } from 'react-native';
import { Screen } from '../src/components/Screen';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { OutlineButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { SUPPORT_EMAIL } from '../src/terms';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../src/theme';
import { routes } from '../src/routes';
import { hebrewCenter } from '../src/typography';

export default function SuspendedScreen() {
  const { me } = useApp();
  const banned = me?.banned;
  const until = me?.suspendedUntil
    ? new Date(me.suspendedUntil).toLocaleString('he-IL')
    : '';

  return (
    <Screen scroll>
      <EnvelopeOrb mode="locked" />
      <Title>{banned ? copy.bannedTitle : 'החשבון הושעה זמנית'}</Title>
      <Subtitle>
        {banned
          ? copy.bannedBody
          : 'בגלל דיווחים או שימוש שלא לפי כללי הקהילה. לפנייה:'}
      </Subtitle>
      {!banned && <Text style={styles.email}>{SUPPORT_EMAIL}</Text>}
      {until && !banned ? <Text style={styles.until}>עד: {until}</Text> : null}
      <OutlineButton
        label="דוא״ל לתמיכה"
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
      />
      <OutlineButton label="תמיכה ודיווח" onPress={() => router.push(routes.support)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  until: { color: colors.danger, marginVertical: 16, ...hebrewCenter },
  email: { color: colors.neonCyan, marginVertical: 12, fontSize: 16, ...hebrewCenter },
});
