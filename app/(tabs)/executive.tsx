import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Executive branch leaders - static data since these change infrequently
const executiveLeaders = [
  {
    office: 'President of the United States',
    name: 'Joe Biden',
    party: 'Democratic',
    phone: '202-456-1414',
    url: 'https://www.whitehouse.gov',
  },
  {
    office: 'Vice President of the United States',
    name: 'Kamala Harris',
    party: 'Democratic',
    phone: '202-456-1414',
    url: 'https://www.whitehouse.gov/administration/vice-president-harris/',
  },
  {
    office: 'Secretary of State',
    name: 'Antony Blinken',
    party: 'Democratic',
    url: 'https://www.state.gov',
  },
  {
    office: 'Secretary of the Treasury',
    name: 'Janet Yellen',
    party: 'Democratic',
    url: 'https://home.treasury.gov',
  },
  {
    office: 'Secretary of Defense',
    name: 'Lloyd Austin',
    party: 'Democratic',
    url: 'https://www.defense.gov',
  },
  {
    office: 'Attorney General',
    name: 'Merrick Garland',
    party: 'Democratic',
    url: 'https://www.justice.gov',
  },
  {
    office: 'Secretary of the Interior',
    name: 'Deb Haaland',
    party: 'Democratic',
    url: 'https://www.doi.gov',
  },
  {
    office: 'Secretary of Agriculture',
    name: 'Tom Vilsack',
    party: 'Democratic',
    url: 'https://www.usda.gov',
  },
  {
    office: 'Secretary of Commerce',
    name: 'Gina Raimondo',
    party: 'Democratic',
    url: 'https://www.commerce.gov',
  },
  {
    office: 'Secretary of Labor',
    name: 'Julie Su',
    party: 'Democratic',
    url: 'https://www.dol.gov',
  },
  {
    office: 'Secretary of Health and Human Services',
    name: 'Xavier Becerra',
    party: 'Democratic',
    url: 'https://www.hhs.gov',
  },
  {
    office: 'Secretary of Housing and Urban Development',
    name: 'Marcia Fudge',
    party: 'Democratic',
    url: 'https://www.hud.gov',
  },
  {
    office: 'Secretary of Transportation',
    name: 'Pete Buttigieg',
    party: 'Democratic',
    url: 'https://www.transportation.gov',
  },
  {
    office: 'Secretary of Energy',
    name: 'Jennifer Granholm',
    party: 'Democratic',
    url: 'https://www.energy.gov',
  },
  {
    office: 'Secretary of Education',
    name: 'Miguel Cardona',
    party: 'Democratic',
    url: 'https://www.ed.gov',
  },
  {
    office: 'Secretary of Veterans Affairs',
    name: 'Denis McDonough',
    party: 'Democratic',
    url: 'https://www.va.gov',
  },
  {
    office: 'Secretary of Homeland Security',
    name: 'Alejandro Mayorkas',
    party: 'Democratic',
    url: 'https://www.dhs.gov',
  },
];

export default function ExecutiveScreen() {
  const router = useRouter();

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color="#1E40AF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>EXECUTIVE BRANCH LEADERS</Text>

        {executiveLeaders.map((leader, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.office}>{leader.office}</Text>
            <Text style={styles.name}>{leader.name}</Text>
            {leader.party && (
              <Text style={styles.party}>
                {leader.party === 'Democratic' ? '(D)' : leader.party === 'Republican' ? '(R)' : `(${leader.party})`}
              </Text>
            )}
            
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
