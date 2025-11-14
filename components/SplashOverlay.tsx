import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import * as ExpoSplash from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Text as RNText, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { GLYPH_PATH } from './representGlyphPath';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Star particle type
type Star = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
};

// Firework particle component
const FireworkParticle = ({ delay, direction }: { delay: number; direction: 'left' | 'right' }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 120;
    
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
  const startX = direction === 'left' ? screenWidth * 0.35 : screenWidth * 0.65;
  const startY = screenHeight * 0.45;
  const endX = direction === 'left' ? screenWidth * 0.15 : screenWidth * 0.85;
  const endY = screenHeight * 0.15;
  
  // Calculate angle for rocket rotation
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90; // +90 because rocket points up by default

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const starOpacity = useRef(new Animated.Value(0)).current;
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(starOpacity, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
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
  }, [delay, endX, endY, startX, startY, translateX, translateY, starOpacity]);

  return (
    <View style={styles.fireworkContainer}>
      <Animated.View
        style={[
          styles.fireworkStar,
          {
            left: startX,
            top: startY,
            transform: [
              { translateX }, 
              { translateY },
              { rotate: `${angle}deg` }
            ],
            opacity: starOpacity,
          },
        ]}
      >
        <Image 
          source={require('@/assets/images/splash/rocket.png')} 
          style={styles.rocketImage}
          resizeMode="contain"
        />
      </Animated.View>
      {showExplosion && (
        <Animated.View
          style={[
            styles.explosion,
            {
              left: startX,
              top: startY,
              transform: [{ translateX }, { translateY }],
            },
          ]}
        >
          {[...Array(20)].map((_, i) => (
            <FireworkParticle key={i} delay={i * 20} direction={direction} />
          ))}
        </Animated.View>
      )}
    </View>
  );
};

export default function SplashOverlay(): React.ReactElement | null {
  const [visible, setVisible] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const svgW = 360;
  const svgH = 140;

  const parts = GLYPH_PATH.split(/(?=\sM)/).map((s) => s.trim()).filter(Boolean);

  function bboxOfPath(d: string) {
    const nums = Array.from(d.matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)).map((m) => parseFloat(m[0]));
    let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i];
      const y = nums[i + 1];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX, minY, maxX, maxY };
  }

  const partBBoxes = parts.map(bboxOfPath);
  const globalMinX = Math.min(...partBBoxes.map((b) => b.minX));
  const globalMinY = Math.min(...partBBoxes.map((b) => b.minY));
  const globalMaxX = Math.max(...partBBoxes.map((b) => b.maxX));
  const globalMaxY = Math.max(...partBBoxes.map((b) => b.maxY));

  const pad = 8;
  const bboxW = Math.max(1, globalMaxX - globalMinX);
  const bboxH = Math.max(1, globalMaxY - globalMinY);
  const scale = Math.min((svgW - pad * 2) / bboxW, (svgH - pad * 2) / bboxH);
  const tx = (svgW - bboxW * scale) / 2 - globalMinX * scale;
  const ty = (svgH - bboxH * scale) / 2 - globalMinY * scale;

  const strokeOffsets = useRef(parts.map(() => new Animated.Value(2000))).current;
  const fillOpacities = useRef(parts.map(() => new Animated.Value(0))).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const AnimatedPath = Animated.createAnimatedComponent(Path);

  useEffect(() => {
    // Only run animation once, on initial mount
    if (hasNavigated) return;
    
    let mounted = true;
    const run = async () => {
      try {
        await ExpoSplash.hideAsync();
      } catch (e) {
        console.warn('[SplashOverlay] hideAsync failed', e);
      }

      if (!mounted) return;

      for (let i = 0; i < parts.length; i++) {
        const d = parts[i];
        const approxLen = Math.max(80, d.length * 1);
        const delay = i === 0 ? 0 : 50;
        
        strokeOffsets[i].setValue(2000);
        fillOpacities[i].setValue(0);
        
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(strokeOffsets[i], { toValue: 0, duration: Math.min(180, approxLen), useNativeDriver: false }),
            Animated.timing(fillOpacities[i], { toValue: 1, duration: Math.min(180, approxLen), useNativeDriver: false })
          ]).start();
        }, delay);
        
        if (i < parts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay + 30));
        }
      }
      
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create and animate star explosion
      const starCount = 20;
      const newStars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        const angle = (Math.PI * 2 * i) / starCount;
        const distance = 100 + Math.random() * 100;
        const star: Star = {
          id: i,
          x: new Animated.Value(0),
          y: new Animated.Value(0),
          opacity: new Animated.Value(1),
          scale: new Animated.Value(0.5 + Math.random() * 0.5),
          rotation: new Animated.Value(0),
        };
        newStars.push(star);

        // Animate star outward
        Animated.parallel([
          Animated.timing(star.x, {
            toValue: Math.cos(angle) * distance,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(star.y, {
            toValue: Math.sin(angle) * distance,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(star.rotation, {
            toValue: 360 + Math.random() * 360,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }
      setStars(newStars);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fade in subtitle
      await new Promise((resolve) => {
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start(() => resolve(undefined));
      });

      // Let it linger for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fade out everything
      await new Promise((resolve) => {
        Animated.timing(overlayOpacity, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => resolve(undefined));
      });

      if (mounted && !hasNavigated) {
        setVisible(false);
        setHasNavigated(true);
        // Navigate to login after splash completes
        router.replace('/login');
      }
    };

    const t = setTimeout(run, 120);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [hasNavigated]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: overlayOpacity }]} pointerEvents="none">
      {/* Fireworks */}
      <Firework direction="left" delay={750} />
      <Firework direction="right" delay={750} />
      
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        <Defs>
          <LinearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#CC0000" />
            <Stop offset="50%" stopColor="#666666" />
            <Stop offset="100%" stopColor="#0028AA" />
          </LinearGradient>
        </Defs>

        <G transform={`translate(${tx} ${ty}) scale(${scale})`}>
          {parts.map((d, idx) => (
            <AnimatedPath
              key={`p-${idx}`}
              d={d}
              fill="url(#logoGradient)"
              fillOpacity={fillOpacities[idx]}
              fillRule="nonzero"
              stroke="url(#logoGradient)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2000"
              strokeDashoffset={strokeOffsets[idx]}
            />
          ))}
          {/* Inner holes for "e" letters and "p" - parts 2, 4, 7, 10 */}
          {[2, 4, 7, 10].map((idx) => (
            <AnimatedPath
              key={`h-${idx}`}
              d={parts[idx]}
              fill="#FFFFFF"
              fillOpacity={fillOpacities[idx]}
              stroke="none"
            />
          ))}
        </G>
      </Svg>

      {/* Gold star explosion */}
      {stars.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              transform: [
                { translateX: star.x },
                { translateY: star.y },
                { scale: star.scale },
                { rotate: star.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }) },
              ],
              opacity: star.opacity,
            },
          ]}
        >
          <RNText style={styles.starText}>⭐</RNText>
        </Animated.View>
      ))}

      <Animated.View style={[styles.subtitleWrap, { opacity: subtitleOpacity }]}>
        <View style={styles.bubbleTextContainer}>
          {/* Stroke layer */}
          <RNText style={[styles.subtitle, styles.subtitleStroke]}>POWER TO THE PEOPLE</RNText>
          {/* Fill layer */}
          <RNText style={[styles.subtitle, styles.subtitleFill]}>POWER TO THE PEOPLE</RNText>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    ...StyleSheet.absoluteFillObject, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
  },
  subtitleWrap: { marginTop: 16 },
  bubbleTextContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  subtitle: { 
    fontSize: 22, 
    textAlign: 'center', 
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitleStroke: {
    color: '#000000',
    position: 'absolute',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  subtitleFill: {
    color: '#FFFFFF',
  },
  star: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  starText: {
    fontSize: 24,
    color: '#FFD700',
  },
  fireworkContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  fireworkStar: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireworkStarText: {
    fontSize: 24,
  },
  rocketImage: {
    width: 40,
    height: 40,
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
