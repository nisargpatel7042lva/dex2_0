/**
 * Test Page for Token-2022 Liquidity Service
 * Add this to your app navigation to test the service
 */

import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Token2022LiquidityTestComponent } from '../components/Token2022LiquidityTestComponent';

export default function Token2022TestPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Token2022LiquidityTestComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
