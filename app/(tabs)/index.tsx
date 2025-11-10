import ParallaxScrollView from '@/components/ParallaxScrollView';
import USMapHeader from '@/components/USMapHeader';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFFFFF', dark: '#FFFFFF' }}
      headerImage={<USMapHeader />}>
      
      <LinearGradient
        colors={['#93C5FD', '#E0F2FE', '#FFFFFF', '#FECACA', '#F87171']}
        locations={[0, 0.25, 0.45, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}>
        <View style={styles.content}>
        <Text style={styles.pageTitle}>Headquarters</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Visibility</Text>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#DC2626', '#FFFFFF', '#1E40AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </View>
          <Text style={styles.scoreText}>500</Text>
          <Text style={styles.cardText}>
            Improve your VIS to increase your influence on political leaders
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stay Informed</Text>
          <Text style={styles.cardText}>
            Get updates on upcoming elections, important dates, and ballot measures in your area.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connect Locally</Text>
          <Text style={styles.cardText}>
            Find representatives, polling locations, and engage with your community on issues that matter.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Make Your Voice Heard</Text>
          <Text style={styles.cardText}>
            Every vote counts. Track your voting streak and build your civic engagement profile.
          </Text>
        </View>
        </View>
      </LinearGradient>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  pageTitle: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 28,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  card: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1E40AF',
    letterSpacing: -0.3,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    width: '10%',
    height: '100%',
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    opacity: 0.9,
  },
});
