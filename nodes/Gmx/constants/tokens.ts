/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isStable: boolean;
  isShortable: boolean;
  isWrappedNative: boolean;
  imageUrl?: string;
  coingeckoId?: string;
}

export const TOKENS: Record<string, Record<string, TokenConfig>> = {
  arbitrum: {
    ETH: {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'ethereum',
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: true,
      coingeckoId: 'weth',
    },
    BTC: {
      symbol: 'BTC',
      name: 'Bitcoin',
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      decimals: 8,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'bitcoin',
    },
    WBTC: {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      decimals: 8,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'wrapped-bitcoin',
    },
    LINK: {
      symbol: 'LINK',
      name: 'Chainlink',
      address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'chainlink',
    },
    UNI: {
      symbol: 'UNI',
      name: 'Uniswap',
      address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'uniswap',
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      decimals: 6,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'usd-coin',
    },
    'USDC.e': {
      symbol: 'USDC.e',
      name: 'Bridged USD Coin',
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      decimals: 6,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'usd-coin',
    },
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      decimals: 6,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'tether',
    },
    DAI: {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      decimals: 18,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'dai',
    },
    FRAX: {
      symbol: 'FRAX',
      name: 'Frax',
      address: '0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F',
      decimals: 18,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'frax',
    },
    ARB: {
      symbol: 'ARB',
      name: 'Arbitrum',
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'arbitrum',
    },
    GMX: {
      symbol: 'GMX',
      name: 'GMX',
      address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
      decimals: 18,
      isStable: false,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'gmx',
    },
    GLP: {
      symbol: 'GLP',
      name: 'GMX LP',
      address: '0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258',
      decimals: 18,
      isStable: false,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'gmx-lp',
    },
    SOL: {
      symbol: 'SOL',
      name: 'Solana',
      address: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07',
      decimals: 9,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'solana',
    },
  },
  avalanche: {
    AVAX: {
      symbol: 'AVAX',
      name: 'Avalanche',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'avalanche-2',
    },
    WAVAX: {
      symbol: 'WAVAX',
      name: 'Wrapped AVAX',
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: true,
      coingeckoId: 'wrapped-avax',
    },
    'WETH.e': {
      symbol: 'WETH.e',
      name: 'Wrapped Ethereum',
      address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
      decimals: 18,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'weth',
    },
    'BTC.b': {
      symbol: 'BTC.b',
      name: 'Bitcoin',
      address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
      decimals: 8,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'bitcoin',
    },
    'WBTC.e': {
      symbol: 'WBTC.e',
      name: 'Wrapped Bitcoin',
      address: '0x50b7545627a5162F82A992c33b87aDc75187B218',
      decimals: 8,
      isStable: false,
      isShortable: true,
      isWrappedNative: false,
      coingeckoId: 'wrapped-bitcoin',
    },
    'USDC.e': {
      symbol: 'USDC.e',
      name: 'USD Coin',
      address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
      decimals: 6,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'usd-coin',
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      decimals: 6,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'usd-coin',
    },
    'USDT.e': {
      symbol: 'USDT.e',
      name: 'Tether USD',
      address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
      decimals: 6,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'tether',
    },
    'DAI.e': {
      symbol: 'DAI.e',
      name: 'Dai Stablecoin',
      address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      decimals: 18,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'dai',
    },
    MIM: {
      symbol: 'MIM',
      name: 'Magic Internet Money',
      address: '0x130966628846BFd36ff31a822705796e8cb8C18D',
      decimals: 18,
      isStable: true,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'magic-internet-money',
    },
    GMX: {
      symbol: 'GMX',
      name: 'GMX',
      address: '0x62edc0692BD897D2295872a9FFCac5425011c661',
      decimals: 18,
      isStable: false,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'gmx',
    },
    GLP: {
      symbol: 'GLP',
      name: 'GMX LP',
      address: '0x01234181085565ed162a948b6a5e88758CD7c7b8',
      decimals: 18,
      isStable: false,
      isShortable: false,
      isWrappedNative: false,
      coingeckoId: 'gmx-lp',
    },
  },
};

export function getTokenConfig(network: string, symbol: string): TokenConfig | undefined {
  return TOKENS[network]?.[symbol];
}

export function getTokenByAddress(network: string, address: string): TokenConfig | undefined {
  const networkTokens = TOKENS[network];
  if (!networkTokens) return undefined;

  const normalizedAddress = address.toLowerCase();
  return Object.values(networkTokens).find(
    (token) => token.address.toLowerCase() === normalizedAddress,
  );
}

export function getStableTokens(network: string): TokenConfig[] {
  const networkTokens = TOKENS[network];
  if (!networkTokens) return [];
  return Object.values(networkTokens).filter((token) => token.isStable);
}

export function getShortableTokens(network: string): TokenConfig[] {
  const networkTokens = TOKENS[network];
  if (!networkTokens) return [];
  return Object.values(networkTokens).filter((token) => token.isShortable);
}

export function getAllTokens(network: string): TokenConfig[] {
  const networkTokens = TOKENS[network];
  if (!networkTokens) return [];
  return Object.values(networkTokens);
}
