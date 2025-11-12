import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // Image picker logic
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Password validation logic
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    const checks = Object.values(passwordChecks);
    const passed = checks.filter(Boolean).length;
    if (passed === 0) return null;
    if (passed <= 2) return { label: 'Weak', color: '#FF3B30', width: '33%' };
    if (passed <= 4) return { label: 'Medium', color: '#FF9500', width: '66%' };
    return { label: 'Strong', color: '#34C759', width: '100%' };
  }, [passwordChecks]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Upload avatar to Supabase Storage and return public URL
  const uploadAvatar = async (userId: string) => {
    if (!avatar) return null;
    setAvatarUploading(true);
    const ext = avatar.split('.').pop();
    const fileName = `${userId}.${ext}`;
    let fileData;
    let contentType = 'image/jpeg';
    let error;
    if (Platform.OS === 'web') {
      const response = await fetch(avatar);
      fileData = await response.blob();
      contentType = fileData.type || 'image/jpeg';
      ({ error } = await supabase.storage.from('avatars').upload(fileName, fileData, {
        upsert: true,
        contentType,
      }));
    } else {
      // Mobile: use expo-file-system
      fileData = await FileSystem.readAsStringAsync(avatar, { encoding: 'base64' });
      ({ error } = await supabase.storage.from('avatars').upload(fileName, Buffer.from(fileData, 'base64'), {
        upsert: true,
        contentType,
      }));
    }
    setAvatarUploading(false);
    if (error) {
      Alert.alert('Avatar upload failed', error.message);
      return null;
    }
    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data?.publicUrl || null;
  };

  const ensureProfile = async (avatarUrl?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!existing) {
      await supabase.from('profiles').insert({ 
        id: user.id, 
        full_name: `${firstName} ${lastName}`.trim(),
        avatar_url: avatarUrl || null,
      });
    } else if (avatarUrl) {
      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    }
  };

  const onSignup = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Required', 'Please enter your last name');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Required', 'Please enter a username');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email');
      return;
    }
    if (!isPasswordValid) {
      Alert.alert('Weak Password', 'Please meet all password requirements');
      return;
    }

    try {
      setLoading(true);
      let avatarUrl = null;
      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            full_name: `${firstName} ${lastName}`.trim(),
            username: username.toLowerCase(),
          } 
        },
      });
      if (error) throw error;

      if (!data.session) {
        Alert.alert('Check Email', 'Please check your email to verify your account.');
        return;
      }

      // Upload avatar if selected
      if (avatar && data.user?.id) {
        avatarUrl = await uploadAvatar(data.user.id);
      }
      await ensureProfile(avatarUrl ?? undefined);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Signup failed', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const CheckItem = ({ label, checked }: { label: string; checked: boolean }) => (
    <View style={styles.checkItem}>
      <Text style={[styles.checkIcon, checked && styles.checkIconActive]}>
        {checked ? '✓' : '○'}
      </Text>
      <Text style={[styles.checkLabel, checked && styles.checkLabelActive]}>
        {label}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Logo size="large" />
        <Text style={styles.logoText}>Framez</Text>
      </View>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the community today!</Text>

      {/* Avatar picker */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickAvatar} disabled={avatarUploading}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarPreview} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {avatarUploading && <Text style={styles.avatarUploading}>Uploading...</Text>}
      </View>

      <View style={styles.row}>
        <TextInput 
          placeholder="First name" 
          style={[styles.input, styles.halfInput]} 
          value={firstName} 
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <TextInput 
          placeholder="Last name" 
          style={[styles.input, styles.halfInput]} 
          value={lastName} 
          onChangeText={setLastName}
          autoCapitalize="words"
        />
      </View>

      <TextInput 
        placeholder="Username" 
        style={styles.input} 
        value={username} 
        onChangeText={(text) => setUsername(text.toLowerCase())}
        autoCapitalize="none"
      />

      <TextInput 
        placeholder="Email" 
        autoCapitalize="none" 
        keyboardType="email-address" 
        style={styles.input} 
        value={email} 
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput 
          placeholder="Password" 
          secureTextEntry={!showPassword}
          style={[styles.input, styles.passwordInput]} 
          value={password} 
          onChangeText={setPassword}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      </View>

      {password.length > 0 && (
        <>
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarBg}>
              {passwordStrength && (
                <View 
                  style={[
                    styles.strengthBar, 
                    { backgroundColor: passwordStrength.color, width: passwordStrength.width as any }
                  ]} 
                />
              )}
            </View>
            {passwordStrength && (
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                {passwordStrength.label}
              </Text>
            )}
          </View>

          <View style={styles.checksContainer}>
            <CheckItem label="At least 8 characters" checked={passwordChecks.length} />
            <CheckItem label="Contains uppercase letter" checked={passwordChecks.uppercase} />
            <CheckItem label="Contains lowercase letter" checked={passwordChecks.lowercase} />
            <CheckItem label="Contains number" checked={passwordChecks.number} />
            <CheckItem label="Contains special character" checked={passwordChecks.special} />
          </View>
        </>
      )}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={onSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" style={styles.link}>Login</Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarPlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
  avatarUploading: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: { 
    padding: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 4, 
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  input: { 
    width: '100%', 
    backgroundColor: '#fff',
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12,
    fontSize: 16,
    color: '#000', 
  },
  halfInput: {
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  checksContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#ccc',
    width: 20,
  },
  checkIconActive: {
    color: '#34C759',
  },
  checkLabel: {
    fontSize: 14,
    color: '#999',
  },
  checkLabelActive: {
    color: '#333',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
});
