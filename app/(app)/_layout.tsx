import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "../../context/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { Logo } from "../../components/Logo";

export default function AppTabs() {
  const { session } = useAuth();
  
  console.log("🔍 AppTabs rendered, session:", !!session);
  
  // If not logged in, redirect to login
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
          height: Platform.OS === 'android' ? 75 : 90,
          paddingBottom: Platform.OS === 'android' ? 15 : 25,
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
    </Tabs>
  );
}
