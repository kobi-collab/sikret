import { I18nManager, TextStyle } from 'react-native';

/**
 * With app RTL, React Native mirrors horizontal "right" to the visual left.
 * "left" aligns to the Hebrew start edge (visual right).
 */
export const hebrewText: TextStyle = {
  textAlign: I18nManager.isRTL ? 'left' : 'right',
  writingDirection: 'rtl',
};

export const hebrewCenter: TextStyle = {
  textAlign: 'center',
  writingDirection: 'rtl',
};
