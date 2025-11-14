import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import * as ExpoSplash from 'expo-splash-screen';
import { MotiView } from 'moti';
import React, { useEffect } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Firework particle component
const FireworkParticle = ({ delay, direction }: { delay: number; direction: 'left' | 'right' }) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Random angle for particle spread
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 40;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: Math.sin(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX }, { translateY }],
          opacity,
          backgroundColor: direction === 'left' ? '#E31C23' : '#223B7B',
        },
      ]}
    />
  );
};

// Firework component
const Firework = ({ direction, delay }: { direction: 'left' | 'right'; delay: number }) => {
  const startX = screenWidth / 2;
  const startY = screenHeight / 2;
  const endX = direction === 'left' ? screenWidth * 0.15 : screenWidth * 0.85;
  const endY = screenHeight * 0.15;

  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;
  const starOpacity = React.useRef(new Animated.Value(1)).current;
  const [showExplosion, setShowExplosion] = React.useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: endX - startX,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: endY - startY,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowExplosion(true);
      Animated.timing(starOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  }, [delay]);

  return (
    <View style={[styles.fireworkContainer, { left: startX, top: startY }]}>
      <Animated.View
        style={[
          styles.star,
          {
            transform: [{ translateX }, { translateY }],
            opacity: starOpacity,
          },
        ]}
      >
        <Text style={styles.starText}>⭐</Text>
      </Animated.View>
      {showExplosion && (
        <Animated.View
          style={[
            styles.explosion,
            {
              transform: [{ translateX }, { translateY }],
            },
          ]}
        >
          {[...Array(12)].map((_, i) => (
            <FireworkParticle key={i} delay={i * 30} direction={direction} />
          ))}
        </Animated.View>
      )}
    </View>
  );
};

export default function SplashScreen(): React.ReactElement {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [logoOpacity] = React.useState(() => new Animated.Value(0));
  const [taglineOpacity] = React.useState(() => new Animated.Value(0));

  useEffect(() => {
    // Prevent auto-hiding of splash screen
    ExpoSplash.preventAutoHideAsync().catch(console.warn);

    console.log('Splash Screen mounted - starting animations');
    
    // Sequence the animations (longer for debugging)
    Animated.sequence([
      // Fade in logo
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Fade in tagline
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('Animations completed');
    });

    // Navigation is now handled by SplashOverlayCanonical2
    // Just ensure the native splash is hidden
    const hideNativeSplash = async () => {
      try {
        await ExpoSplash.hideAsync();
      } catch (err) {
        console.warn('Error hiding native splash:', err);
      }
    };
    hideNativeSplash();

    return () => {
      console.log('Splash Screen unmounting');
    };
  }, [router, logoOpacity, taglineOpacity]);

  return (
    // Transparent - let the SplashOverlay component handle the splash screen
    <View style={[styles.container, { backgroundColor: '#000000' }]}> 
      {/* Fireworks */}
      <Firework direction="left" delay={500} />
      <Firework direction="right" delay={700} />
      
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ type: 'timing', duration: 20000, loop: true }}>
          <Svg width={120} height={120} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#E31C23" />
                <Stop offset="50%" stopColor="#FFFFFF" />
                <Stop offset="100%" stopColor="#223B7B" />
              </LinearGradient>
            </Defs>
            <Path
              d="M50,10 C70,10 85,25 85,45 C85,65 70,80 50,80 L30,80 L30,60 L50,60 C60,60 65,55 65,45 C65,35 60,30 50,30 L30,30 L30,80 L10,80 L10,10 L50,10 Z"
              fill="url(#logoGradient)"
              strokeWidth="2"
              stroke={Colors[colorScheme].text}
            />
          </Svg>
        </MotiView>
      </Animated.View>
      
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <Text style={[styles.tagline, { color: Colors[colorScheme].text }]}>
          Power to the People
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24 
  },
  logoContainer: {
    marginBottom: 40,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  fireworkContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  star: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 24,
  },
  explosion: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});