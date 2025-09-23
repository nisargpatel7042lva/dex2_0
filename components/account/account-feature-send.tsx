import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { PublicKey } from '@solana/web3.js'
import { ActivityIndicator, TextInput, View, Alert } from 'react-native'
import React, { useState } from 'react'
import { Button } from '@react-navigation/elements'
import { useTransferSol } from '@/components/account/use-transfer-sol'
import { useThemeColor } from '@/hooks/use-theme-color'

export function AccountFeatureSend({ address }: { address: PublicKey }) {
  const transferSol = useTransferSol({ address })
  const [destinationAddress, setDestinationAddress] = useState('')
  const [amount, setAmount] = useState('1')
  const backgroundColor = useThemeColor({ light: '#f0f0f0', dark: '#333333' }, 'background')
  const textColor = useThemeColor({ light: '#000000', dark: '#ffffff' }, 'text')

  // Helper function to validate and submit transfer
  const handleSend = async () => {
    let amt: number;
    let pubkey: PublicKey;
    try {
      if (!destinationAddress) throw new Error('Destination address is required')
      try {
        pubkey = new PublicKey(destinationAddress)
      } catch (e) {
        throw new Error('Destination address is invalid')
      }
      amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) throw new Error('Enter a positive amount')
      await transferSol.mutateAsync({ amount: amt, destination: pubkey })
      Alert.alert('Success', `Sent ${amt} SOL to ${destinationAddress}`)
      // Optionally clear form
      // setAmount('1'); setDestinationAddress('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Check address and amount')
    }
  }

  return (
    <AppView>
      <AppText type="subtitle">Send SOL from the connected wallet.</AppText>
      {transferSol.isPending ? (
        <ActivityIndicator />
      ) : (
        <View style={{ gap: 16 }}>
          <AppText>Amount (SOL)</AppText>
          <TextInput
            style={{
              backgroundColor,
              color: textColor,
              borderWidth: 1,
              borderRadius: 25,
              paddingHorizontal: 16,
            }}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor={textColor}
          />
          <AppText>Destination Address</AppText>
          <TextInput
            style={{
              backgroundColor,
              color: textColor,
              borderWidth: 1,
              borderRadius: 25,
              paddingHorizontal: 16,
            }}
            value={destinationAddress}
            onChangeText={setDestinationAddress}
            placeholder="Paste Solana address"
            placeholderTextColor={textColor}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            disabled={transferSol.isPending}
            onPress={handleSend}
            variant="filled"
          >
            Send SOL
          </Button>
        </View>
      )}
      {transferSol.isError ? (
        <AppText style={{ color: 'red', fontSize: 12 }}>
          {transferSol.error?.message || 'Transaction failed'}
        </AppText>
      ) : null}
    </AppView>
  )
}