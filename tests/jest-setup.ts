// Jest-only setup. @testing-library/react-native v13+ ships matchers built-in.
//
// expo-router's useRouter() touches an internal `isReady` state that is not
// hydrated under jest's React renderer. Stub it globally so any AppShell-wrapped
// screen can render without each test having to mock the module itself.
import { jest } from '@jest/globals';

// The native glass module isn't available in jest — short-circuit its
// require to a pass-through View so the paper fallback isn't even attempted
// and the noisy stack trace goes away. Children still render so RNTL queries
// continue to find them.
jest.mock(
  '../modules/glass-surface/src',
  () => {
    const { View } = jest.requireActual('react-native') as { View: unknown };
    return { default: View };
  },
  { virtual: true },
);

jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router') as Record<string, unknown>;
  return {
    ...actual,
    useRouter: () => ({
      push: () => {},
      replace: () => {},
      back: () => {},
      canGoBack: () => false,
      navigate: () => {},
      setParams: () => {},
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
  };
});

export {};
