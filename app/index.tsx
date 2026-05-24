import { Redirect } from 'expo-router';

/**
 * The (tabs) group does not contribute to the URL, so `/` is not served
 * by any tab. Unconditionally redirect to the Incidents tab — the
 * Passport tab handles first-run inline via its empty state.
 */
export default function Index() {
  return <Redirect href="/(tabs)/incidents" />;
}
