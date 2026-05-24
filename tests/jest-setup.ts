// Jest-only setup. @testing-library/react-native v13+ ships matchers built-in.
//
// expo-router's useRouter() touches an internal `isReady` state that is not
// hydrated under jest's React renderer. Stub it globally so any AppShell-wrapped
// screen can render without each test having to mock the module itself.
import { jest } from '@jest/globals';

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
