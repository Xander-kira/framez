import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="[userId]"
        options={{
          title: 'Profile',
        }}
      />
    </Stack>
  );
}
