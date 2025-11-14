import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyRepsScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#93C5FD', '#E0F2FE', '#FFFFFF', '#FECACA', '#F87171']}
      locations={[0, 0.25, 0.45, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>MY REPRESENTATIVES</Text>
        <Text style={styles.subtitle}>Choose a category to view your leaders</Text>

        <TouchableOpacity 
          style={styles.bubble}
          onPress={() => router.push('/executive' as any)}
          activeOpacity={0.8}>
          <View style={styles.bubbleIconContainer}>
            <IconSymbol size={48} name="flag.fill" color="#FFFFFF" />
          </View>
          <Text style={styles.bubbleTitle}>Executive Branch</Text>
          <Text style={styles.bubbleDescription}>
            President, Vice President, and Cabinet Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bubble}
          onPress={() => router.push('/congressional' as any)}
          activeOpacity={0.8}>
          <View style={styles.bubbleIconContainer}>
            <IconSymbol size={48} name="building.columns.fill" color="#FFFFFF" />
          </View>
          <Text style={styles.bubbleTitle}>Congressional Representatives</Text>
          <Text style={styles.bubbleDescription}>
            Your US Senators, House Representative, and State Legislators
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  heading: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  bubble: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#1E40AF',
  },
  bubbleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bubbleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  bubbleDescription: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
});
