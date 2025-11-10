import RepresentLogo from '@/components/RepresentLogo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { auth } from '@/providers/firebase';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type FormState = {
  email: string;
  password: string;
  confirm: string;
};

async function firebaseSignUp(email: string, password: string) {
  // Use Firebase Auth to create a user with email and password
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential;
}

export default function SignUp(): React.ReactElement {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [form, setForm] = useState<FormState>({ email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (key: keyof FormState, value: string) => setForm((s) => ({ ...s, [key]: value }));

  const handleSubmit = async () => {
    if (form.password !== form.confirm) {
      Alert.alert('Validation', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await firebaseSignUp(form.email.trim(), form.password);
      // After successful signup, go to sign in
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Sign up failed', err?.message ?? 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.content}>
        <View style={styles.header}>
          <RepresentLogo width={200} height={78} />
          <Text style={styles.tagline}>POWER TO THE PEOPLE</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={form.email}
              onChangeText={(t) => onChange('email', t)}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={form.password}
              onChangeText={(t) => onChange('password', t)}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              secureTextEntry
              value={form.confirm}
              onChangeText={(t) => onChange('confirm', t)}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="Create account">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/login" style={styles.link}>
              <Text style={styles.linkText}>Sign in</Text>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#CC0000',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: 24,
    color: '#222',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 16,
    marginBottom: 24,
  },
  input: { 
    height: 52, 
    borderWidth: 2, 
    borderColor: '#E5E5E5',
    borderRadius: 12, 
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#222',
  },
  button: { 
    height: 52, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#CC0000',
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 24,
  },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  link: { 
    padding: 4,
  },
  linkText: {
    color: '#CC0000',
    fontWeight: '600',
    fontSize: 14,
  },
});