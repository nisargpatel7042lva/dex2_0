import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface TokenIconProps {
  address: string;
  symbol: string;
  size?: number;
  style?: any;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ 
  address, 
  symbol, 
  size = 32, 
  style 
}) => {
  const { getTokenImageUrl, getFallbackIcon, getTokenColor } = useApp();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTokenImage = async () => {
      try {
        setLoading(true);
        // Add a small delay to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 100));
        const url = await getTokenImageUrl(address);
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading token image:', error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    // Only load if we have the required functions
    if (getTokenImageUrl && address) {
      loadTokenImage();
    } else {
      setLoading(false);
    }
  }, [address, getTokenImageUrl]);

  const fallbackIcon = getFallbackIcon(symbol);
  const tokenColor = getTokenColor(symbol);

  if (loading) {
    return (
      <View style={[
        styles.container, 
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}>
        <Ionicons name="ellipse" size={size * 0.6} color="#6366f1" />
      </View>
    );
  }

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[
      styles.fallbackContainer,
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: tokenColor + '20' // Add transparency
      },
      style
    ]}>
      <Ionicons 
        name={fallbackIcon as any} 
        size={size * 0.6} 
        color={tokenColor} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  image: {
    backgroundColor: 'transparent',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 