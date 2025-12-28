/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  subgraphUrls: {
    v1Stats: string;
    v2Stats: string;
    v2Positions: string;
  };
  supportsV1: boolean;
  supportsV2: boolean;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    subgraphUrls: {
      v1Stats: 'https://api.thegraph.com/subgraphs/name/gmx-io/gmx-stats',
      v2Stats:
        'https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-arbitrum-stats/api',
      v2Positions:
        'https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-arbitrum-positions/api',
    },
    supportsV1: true,
    supportsV2: true,
  },
  avalanche: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    subgraphUrls: {
      v1Stats: 'https://api.thegraph.com/subgraphs/name/gmx-io/gmx-avalanche-stats',
      v2Stats:
        'https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-avalanche-stats/api',
      v2Positions:
        'https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-avalanche-positions/api',
    },
    supportsV1: true,
    supportsV2: true,
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    subgraphUrls: {
      v1Stats: '',
      v2Stats: '',
      v2Positions: '',
    },
    supportsV1: false,
    supportsV2: true,
  },
};

export const DEFAULT_NETWORK = 'arbitrum';

export const CHAIN_ID_TO_NETWORK: Record<number, string> = {
  42161: 'arbitrum',
  43114: 'avalanche',
  421614: 'arbitrumSepolia',
};

export function getNetworkConfig(network: string): NetworkConfig {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  return config;
}

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  const networkKey = CHAIN_ID_TO_NETWORK[chainId];
  return networkKey ? NETWORKS[networkKey] : undefined;
}
