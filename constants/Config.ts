// Centralized config for environment variables and app settings

const CIVIC_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CIVIC_API_KEY;

export const Config = {
  CIVIC_API_KEY,
};

export function requireConfig() {
  const missing: string[] = [];
  if (!CIVIC_API_KEY) missing.push('EXPO_PUBLIC_GOOGLE_CIVIC_API_KEY');
  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}.\n` +
        'Set them in a .env file or your environment. For Expo, use EXPO_PUBLIC_* variables.'
    );
  }
}
