import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) throw error;
      if (!data?.session) {
        Alert.alert(
          "Login failed",
          "No session returned. Please check your credentials or confirm your email."
        );
        return;
      }
      router.replace("/(app)");
    } catch (e: any) {
      Alert.alert("Login failed", e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset link to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setResetLoading(true);
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: 'framez://reset-password',
              });

              if (error) throw error;

              Alert.alert(
                'Check Your Email',
                'We sent you a password reset link. Please check your email inbox.'
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send reset email');
            } finally {
              setResetLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo size="large" />
        <Text style={styles.logoText}>Framez</Text>
      </View>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput
        placeholder="e.g. johndoe@gmail.com"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { color: '#888' }]}
        value={email}
        onChangeText={setEmail}
      />
      <View style={{ width: '100%', position: 'relative' }}>
        <TextInput
          placeholder="e.g. mypassword123"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          style={[styles.input, { color: '#888', marginBottom: 0 }]}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={{ position: 'absolute', right: 16, top: 16 }}
        >
          <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        onPress={handleForgotPassword} 
        disabled={resetLoading}
        style={styles.forgotPassword}
      >
        <Text style={styles.forgotPasswordText}>
          {resetLoading ? 'Sending...' : 'Forgot Password?'}
        </Text>
      </TouchableOpacity>
      <Button title={loading ? 'Loading…' : 'Login'} onPress={onLogin} disabled={loading} />
      <View style={{ height: 16 }} />
      <Link href="/signup">No account? Sign up</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5', color: 'black' },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24, color: '#333' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, color: '#888' },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});