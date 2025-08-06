import { safeFirst } from '@/src/utils/wallet-debug'
import { SignInPayload } from '@solana-mobile/mobile-wallet-adapter-protocol'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { Transaction, TransactionSignature, VersionedTransaction } from '@solana/web3.js'
import { useCallback, useMemo } from 'react'
import { Account, useAuthorization } from './use-authorization'

export function useMobileWallet() {
  const { authorizeSessionWithSignIn, authorizeSession, deauthorizeSessions } = useAuthorization()

  const connect = useCallback(async (): Promise<Account> => {
    return await transact(async (wallet) => {
      return await authorizeSession(wallet)
    })
  }, [authorizeSession])

  const signIn = useCallback(
    async (signInPayload: SignInPayload): Promise<Account> => {
      return await transact(async (wallet) => {
        return await authorizeSessionWithSignIn(wallet, signInPayload)
      })
    },
    [authorizeSessionWithSignIn],
  )

  const disconnect = useCallback(async (): Promise<void> => {
    await deauthorizeSessions()
  }, [deauthorizeSessions])

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction, minContextSlot: number): Promise<TransactionSignature> => {
      return await transact(async (wallet) => {
        await authorizeSession(wallet)
        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
          minContextSlot,
        })
        if (!signatures || signatures.length === 0) {
          throw new Error('No signatures returned from wallet')
        }
        return safeFirst(signatures, 'No valid signature returned from wallet')
      })
    },
    [authorizeSession],
  )

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      return await transact(async (wallet) => {
        const authResult = await authorizeSession(wallet)
        const signedMessages = await wallet.signMessages({
          addresses: [authResult.address],
          payloads: [message],
        })
        if (!signedMessages || signedMessages.length === 0) {
          throw new Error('No signed messages returned from wallet')
        }
        return safeFirst(signedMessages, 'No valid signed message returned from wallet')
      })
    },
    [authorizeSession],
  )

  return useMemo(
    () => ({
      connect,
      signIn,
      disconnect,
      signAndSendTransaction,
      signMessage,
    }),
    [connect, disconnect, signAndSendTransaction, signIn, signMessage],
  )
}
