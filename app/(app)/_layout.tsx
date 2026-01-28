import { Tabs, Redirect } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "../../components/Logo";
import { useSession } from "../../hooks/useSession";

export default function AppTabs() {
  const { session, loading } = useSession();
  const insets = useSafeAreaInsets();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 70,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 10,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Feed",
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Logo size="small" />
            </View>
          ),
          tabBarLabel: "Feed",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="create" 
        options={{ 
          title: "Create",
          headerTitle: "Create Post",
          tabBarLabel: "Create",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }} 
      />

      <Tabs.Screen 
        name="search" 
        options={{ 
          title: "Search",
          headerTitle: "Search Users",
          tabBarLabel: "Search",
          tabBarIcon: ({ color, size}) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }} 
      />

      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: "Notifications",
          headerTitle: "Notifications",
          tabBarLabel: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }} 
      />

      
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          headerTitle: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }} 
      />

      {/* Hide these screens from the tab bar */}
      <Tabs.Screen 
        name="feed" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="PostComments" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="edit-profile" 
        options={{ 
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="user" 
        options={{ 
          href: null,
          title: 'Profile',
        }} 
      />
      <Tabs.Screen 
        name="create-story" 
        options={{ 
          href: null,
        }} 
      />
    </Tabs>
  );
}
