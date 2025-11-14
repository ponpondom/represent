import { ProfileImage } from '@/components/ProfileImage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/providers/firebase';
import { getRepresentativesByAddress, type Representative } from '@/services/civic';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CongressionalScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRepresentatives();
  }, [user]);

  const loadRepresentatives = async () => {
    if (!user) {
      setError('Please log in to view your representatives');
      setLoading(false);
      return;
    }

    try {
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (!profileDoc.exists()) {
        setError('Please complete your profile with your address');
        setLoading(false);
        return;
      }

      const profile = profileDoc.data();
      const fullAddress = `${profile.address}, ${profile.city}, ${profile.state} ${profile.zipCode}`;

      // Fetch representatives from Google Civic API
      const { representatives: reps } = await getRepresentativesByAddress(fullAddress);
      console.log('Representatives data:', reps.map(r => ({ name: r.name, photoUrl: r.photoUrl })));
      setRepresentatives(reps);
      setError('');
    } catch (err: any) {
      console.error('Error loading representatives:', err);
      setError(err.message || 'Failed to load representatives');
    } finally {
      setLoading(false);
    }
  };

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <LinearGradient
      colors={['#93C5FD', '#E0F2FE', '#FFFFFF', '#FECACA', '#F87171']}
      locations={[0, 0.25, 0.45, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.push('/explore' as any)} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color="#1E40AF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>CONGRESSIONAL REPRESENTATIVES</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading your representatives...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadRepresentatives} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          representatives.map((rep, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <ProfileImage
                  source={rep.photoUrl ? { uri: rep.photoUrl } : undefined}
                  name={rep.name}
                  size={80}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.office}>{rep.office}</Text>
                  <Text style={styles.name}>{rep.name}</Text>
                  {rep.party && (
                    <Text style={styles.party}>
                      {rep.party === 'Democratic' ? '(D)' : rep.party === 'Republican' ? '(R)' : `(${rep.party})`}
                    </Text>
                  )}
                </View>
              </View>
              
              {rep.phones && rep.phones.length > 0 && (
                <Text style={styles.contact}>📞 {rep.phones[0]}</Text>
              )}
              
              {rep.urls && rep.urls.length > 0 && (
                <TouchableOpacity onPress={() => openUrl(rep.urls![0])}>
                  <Text style={styles.link}>🌐 Visit Website</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '600',
    marginLeft: 4,
  },
  heading: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1E40AF',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#E5E7EB',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  office: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  party: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  contact: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  link: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
