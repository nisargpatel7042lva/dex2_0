import { Cluster } from '@/components/cluster/cluster'
import { ClusterNetwork } from '@/components/cluster/cluster-network'
import { clusterApiUrl } from '@solana/web3.js'

export class AppConfig {
  static name = 'web3js-expo'
  static uri = 'https://example.com'
  static clusters: Cluster[] = [
    {
      id: 'solana:mainnet-beta',
      name: 'Mainnet Beta',
      endpoint: clusterApiUrl('mainnet-beta'),
      network: ClusterNetwork.Mainnet,
    },
  ]
}
