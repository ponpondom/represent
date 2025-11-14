import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/providers/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Federal executive leaders
const federalLeaders = [
  {
    office: 'President of the United States',
    name: 'Donald Trump',
    party: 'Republican',
    phone: '202-456-1414',
    url: 'https://www.whitehouse.gov',
    photoUrl: 'https://cdn.britannica.com/93/234593-050-32F1E431/Donald-Trump-2023.jpg',
  },
  {
    office: 'Vice President of the United States',
    name: 'JD Vance',
    party: 'Republican',
    phone: '202-456-1414',
    url: 'https://www.whitehouse.gov',
    photoUrl: 'https://cdn.britannica.com/37/268237-050-8E92E0A1/JD-Vance-2024.jpg',
  },
];

// State governors by state code
const stateGovernors: Record<string, { governor: string; ltGovernor: string; party: string; url: string; governorPhoto?: string; ltGovernorPhoto?: string }> = {
  IL: {
    governor: 'JB Pritzker',
    ltGovernor: 'Juliana Stratton',
    party: 'Democratic',
    url: 'https://www2.illinois.gov/sites/gov/Pages/default.aspx',
    governorPhoto: 'https://cdn.britannica.com/85/228485-050-3C0A0C29/JB-Pritzker-2021.jpg',
    ltGovernorPhoto: 'https://i.imgur.com/placeholder.jpg', // Placeholder - Britannica doesn't have Stratton
  },
  // Add more states as needed
};

export default function ExecutiveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserState();
  }, [user]);

  const loadUserState = async () => {
    if (!user) {
      setError('Please log in to view your representatives');
      setLoading(false);
      return;
    }

    try {
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (!profileDoc.exists()) {
        setError('Please complete your profile');
        setLoading(false);
        return;
      }

      const profile = profileDoc.data();
      setUserState(profile.state || '');
      setError('');
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
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

        <Text style={styles.heading}>EXECUTIVE BRANCH LEADERS</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {federalLeaders.map((leader, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  {leader.photoUrl && (
                    <Image
                      source={{ uri: leader.photoUrl }}
                      style={styles.profileImage}
                      onError={(e) => console.log('Image load error:', leader.name, leader.photoUrl, e.nativeEvent.error)}
                    />
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.office}>{leader.office}</Text>
                    <Text style={styles.name}>{leader.name}</Text>
                    {leader.party && (
                      <Text style={styles.party}>
                        {leader.party === 'Democratic' ? '(D)' : leader.party === 'Republican' ? '(R)' : `(${leader.party})`}
                      </Text>
                    )}
                  </View>
                </View>
                
                {leader.phone && (
                  <Text style={styles.contact}>📞 {leader.phone}</Text>
                )}
                
                {leader.url && (
                  <TouchableOpacity onPress={() => openUrl(leader.url)}>
                    <Text style={styles.link}>🌐 Visit Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {userState && stateGovernors[userState] && (
              <>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    {stateGovernors[userState].governorPhoto && (
                      <Image
                        source={{ uri: stateGovernors[userState].governorPhoto }}
                        style={styles.profileImage}
                        onError={(e) => console.log('Image load error (Governor):', stateGovernors[userState].governor, stateGovernors[userState].governorPhoto, e.nativeEvent.error)}
                      />
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.office}>Governor of {userState}</Text>
                      <Text style={styles.name}>{stateGovernors[userState].governor}</Text>
                      <Text style={styles.party}>
                        {stateGovernors[userState].party === 'Democratic' ? '(D)' : '(R)'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => openUrl(stateGovernors[userState].url)}>
                    <Text style={styles.link}>🌐 Visit Website</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    {stateGovernors[userState].ltGovernorPhoto && (
                      <Image
                        source={{ uri: stateGovernors[userState].ltGovernorPhoto }}
                        style={styles.profileImage}
                        onError={(e) => console.log('Image load error (Lt Gov):', stateGovernors[userState].ltGovernor, stateGovernors[userState].ltGovernorPhoto, e.nativeEvent.error)}
                      />
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.office}>Lieutenant Governor of {userState}</Text>
                      <Text style={styles.name}>{stateGovernors[userState].ltGovernor}</Text>
                      <Text style={styles.party}>
                        {stateGovernors[userState].party === 'Democratic' ? '(D)' : '(R)'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => openUrl(stateGovernors[userState].url)}>
                    <Text style={styles.link}>🌐 Visit Website</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
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
