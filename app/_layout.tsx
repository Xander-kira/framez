import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* hide header for auth group */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      {/* hide header for app group */}
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      {/* your other routes */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
