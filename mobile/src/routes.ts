import type { Href } from 'expo-router';

/** Typed routes — update when adding screens */
export const routes = {
  home: '/' as Href,
  terms: '/terms' as Href,
  support: '/support' as Href,
  onboarding: '/onboarding' as Href,
  intention: '/intention' as Href,
  compose: '/compose' as Href,
  send: '/send' as Href,
  queue: '/queue' as Href,
  swap: '/swap' as Href,
  suspended: '/suspended' as Href,
} as const;
