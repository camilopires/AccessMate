import { TamaguiProvider } from 'tamagui';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { View } from 'react-native';
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts as useFraunces,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import config from '../tamagui.config';
import { colors } from '../src/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFraunces({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Head>
        <title>AccessMate</title>
        <meta name="description" content="AccessMate — UK accessibility travel companion." />
      </Head>
      {fontsLoaded ? (
        <Stack
          screenOptions={{
            headerShown: false,
            title: 'AccessMate',
            contentStyle: { backgroundColor: colors.bg.paper },
          }}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bg.paper }} />
      )}
    </TamaguiProvider>
  );
}
