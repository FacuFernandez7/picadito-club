import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// @ts-ignore
import { TournamentProvider } from '../context/TournamentContext';

export default function RootLayout() {
  return (
    <TournamentProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </TournamentProvider>
  );
}
