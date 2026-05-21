import { TamaguiProvider } from 'tamagui';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import config from '../tamagui.config';

export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Head>
        <title>AccessMate</title>
        <meta name="description" content="AccessMate — UK accessibility travel companion." />
      </Head>
      <Stack screenOptions={{ headerShown: false, title: 'AccessMate' }} />
    </TamaguiProvider>
  );
}
