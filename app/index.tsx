import { useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import { getSettingsStore } from '../src/settings/factory';

/**
 * The (tabs) group does not contribute to the URL, so `/` is not served
 * by any tab. Either redirect to /onboarding (first run) or to the
 * Incidents tab (the chosen default landing per the v0.2 design).
 */
export default function Index() {
  const settings = useMemo(() => getSettingsStore(), []);
  const [onboardingComplete] = useState(() => settings.get().onboardingComplete);
  return <Redirect href={onboardingComplete ? '/(tabs)/incidents' : '/onboarding'} />;
}
