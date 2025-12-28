/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface MarketConfig {
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  name: string;
  symbol: string;
  isSpotOnly: boolean;
  maxLeverage: number;
}

// GMX V2 Markets on Arbitrum
export const MARKETS_ARBITRUM: Record<string, MarketConfig> = {
  'ETH/USD': {
    marketToken: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
    indexToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'ETH/USD',
    symbol: 'GM: ETH-USDC',
    isSpotOnly: false,
    maxLeverage: 100,
  },
  'BTC/USD': {
    marketToken: '0x47c031236e19d024b42f8AE6780E44A573170703',
    indexToken: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    longToken: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'BTC/USD',
    symbol: 'GM: BTC-USDC',
    isSpotOnly: false,
    maxLeverage: 100,
  },
  'LINK/USD': {
    marketToken: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
    indexToken: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    longToken: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'LINK/USD',
    symbol: 'GM: LINK-USDC',
    isSpotOnly: false,
    maxLeverage: 50,
  },
  'ARB/USD': {
    marketToken: '0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407',
    indexToken: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    longToken: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'ARB/USD',
    symbol: 'GM: ARB-USDC',
    isSpotOnly: false,
    maxLeverage: 50,
  },
  'SOL/USD': {
    marketToken: '0x09400D9DB990D5ED3f35D7be61DfAEB900Af03C9',
    indexToken: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07',
    longToken: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'SOL/USD',
    symbol: 'GM: SOL-USDC',
    isSpotOnly: false,
    maxLeverage: 50,
  },
  'UNI/USD': {
    marketToken: '0xc7Abb2C5f3BF3CEB389dF0Eecd6120D451170B50',
    indexToken: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    longToken: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'UNI/USD',
    symbol: 'GM: UNI-USDC',
    isSpotOnly: false,
    maxLeverage: 50,
  },
  'SWAP:ETH-USDC': {
    marketToken: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
    indexToken: '0x0000000000000000000000000000000000000000',
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'SWAP:ETH-USDC',
    symbol: 'GM: ETH-USDC [SWAP]',
    isSpotOnly: true,
    maxLeverage: 1,
  },
  'SWAP:BTC-USDC': {
    marketToken: '0x47c031236e19d024b42f8AE6780E44A573170703',
    indexToken: '0x0000000000000000000000000000000000000000',
    longToken: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    name: 'SWAP:BTC-USDC',
    symbol: 'GM: BTC-USDC [SWAP]',
    isSpotOnly: true,
    maxLeverage: 1,
  },
};

// GMX V2 Markets on Avalanche
export const MARKETS_AVALANCHE: Record<string, MarketConfig> = {
  'AVAX/USD': {
    marketToken: '0x913C1F46b48b3eD35E7dc3Cf754d4ae8499F31CF',
    indexToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    longToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    shortToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    name: 'AVAX/USD',
    symbol: 'GM: AVAX-USDC',
    isSpotOnly: false,
    maxLeverage: 100,
  },
  'ETH/USD': {
    marketToken: '0xB7e69749E3d2EDd90ea59A4932EFEa2D41E245d7',
    indexToken: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    longToken: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    shortToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    name: 'ETH/USD',
    symbol: 'GM: ETH-USDC',
    isSpotOnly: false,
    maxLeverage: 100,
  },
  'BTC/USD': {
    marketToken: '0xFb02132333A79C8B5Bd0b64E3AbccA5f7fAf2937',
    indexToken: '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
    longToken: '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
    shortToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    name: 'BTC/USD',
    symbol: 'GM: BTC-USDC',
    isSpotOnly: false,
    maxLeverage: 100,
  },
};

export const MARKETS: Record<string, Record<string, MarketConfig>> = {
  arbitrum: MARKETS_ARBITRUM,
  avalanche: MARKETS_AVALANCHE,
};

export function getMarket(network: string, marketKey: string): MarketConfig | undefined {
  return MARKETS[network]?.[marketKey];
}

export function getMarketByToken(network: string, marketToken: string): MarketConfig | undefined {
  const networkMarkets = MARKETS[network];
  if (!networkMarkets) return undefined;

  const normalizedAddress = marketToken.toLowerCase();
  return Object.values(networkMarkets).find(
    (market) => market.marketToken.toLowerCase() === normalizedAddress,
  );
}

export function getAllMarkets(network: string): MarketConfig[] {
  const networkMarkets = MARKETS[network];
  if (!networkMarkets) return [];
  return Object.values(networkMarkets);
}

export function getPerpetualMarkets(network: string): MarketConfig[] {
  const networkMarkets = MARKETS[network];
  if (!networkMarkets) return [];
  return Object.values(networkMarkets).filter((market) => !market.isSpotOnly);
}

export function getSpotMarkets(network: string): MarketConfig[] {
  const networkMarkets = MARKETS[network];
  if (!networkMarkets) return [];
  return Object.values(networkMarkets).filter((market) => market.isSpotOnly);
}
