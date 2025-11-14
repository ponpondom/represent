import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

interface ProfileImageProps {
  source?: ImageSourcePropType | { uri: string };
  name: string;
  size?: number;
}

export function ProfileImage({ source, name, size = 80 }: ProfileImageProps) {
  const [imageError, setImageError] = React.useState(false);
  
  // Extract initials from name
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const initials = getInitials(name);
  const radius = size / 2;
  const fontSize = size * 0.35; // 35% of the container size

  // If no source provided or image failed to load, show initials
  if (!source || imageError) {
    return (
      <View style={[styles.initialsContainer, { width: size, height: size, borderRadius: radius }]}>
        <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={[styles.image, { width: size, height: size, borderRadius: radius }]}
      onError={() => setImageError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E5E7EB',
  },
  initialsContainer: {
    backgroundColor: '#93C5FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#1E40AF',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
