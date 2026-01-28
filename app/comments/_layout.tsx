import { Stack } from "expo-router";

export default function CommentsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[postId]" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
