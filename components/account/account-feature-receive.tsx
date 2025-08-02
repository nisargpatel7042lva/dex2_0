import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { PublicKey } from '@solana/web3.js'
import { AppQrCode } from '@/components/app-qr-code'
import { Button } from '@react-navigation/elements'
import Clipboard from '@react-native-clipboard/clipboard'

export function AccountFeatureReceive({ address }: { address: PublicKey | undefined }) {
  // Render fallback if address is undefined or invalid
  if (!address) {
    return <AppText>No address available</AppText>
  }

  return (
    <AppView style={{ gap: 16 }}>
      <AppText type="subtitle">Send assets to this address:</AppText>
      <AppView
        // Added minHeight and alignment styles to ensure QR code gets enough space
        style={{ alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 250 }}
      >
        <AppText type="defaultSemiBold" style={{ textAlign: 'center' }}>
          {address.toString()}
        </AppText>
        <Button onPressIn={() => Clipboard.setString(address.toString())}>Copy Address</Button>

        <AppQrCode value={address.toString()} />
      </AppView>
    </AppView>
  )
}
