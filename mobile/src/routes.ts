import type { Href } from 'expo-router';

/** Typed routes — update when adding screens */
export const routes = {
  home: '/' as Href,
  terms: '/terms' as Href,
  support: '/support' as Href,
  onboarding: '/onboarding' as Href,
} as const;
