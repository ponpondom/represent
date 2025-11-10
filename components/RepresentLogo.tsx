import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { GLYPH_PATH } from './representGlyphPath';

type RepresentLogoProps = {
  width?: number;
  height?: number;
};

export default function RepresentLogo({ width = 180, height = 70 }: RepresentLogoProps): React.ReactElement {
  const parts = GLYPH_PATH.split(/(?=\sM)/).map((s) => s.trim()).filter(Boolean);

  // Original SVG viewBox dimensions
  const svgW = 360;
  const svgH = 140;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${svgW} ${svgH}`}>
        <Defs>
          <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#CC0000" />
            <Stop offset="50%" stopColor="#666666" />
            <Stop offset="100%" stopColor="#0028AA" />
          </LinearGradient>
        </Defs>
        <G>
          {parts.map((d, idx) => (
            <Path
              key={idx}
              d={d}
              fill="url(#logoGradient)"
              fillRule="nonzero"
              stroke="none"
            />
          ))}
          {/* Holes for e and p letters */}
          {[2, 4, 7, 10].map((idx) => (
            <Path key={`hole-${idx}`} d={parts[idx]} fill="#FFFFFF" fillRule="nonzero" />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
