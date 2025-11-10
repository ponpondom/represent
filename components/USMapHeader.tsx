import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

export default function USMapHeader() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/us-map-header.png')}
        style={styles.image}
        contentFit="cover"
      />
      <Text style={styles.title}>Represent</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
