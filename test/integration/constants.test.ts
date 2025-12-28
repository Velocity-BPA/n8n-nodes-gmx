/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { NETWORKS, getNetworkConfig } from '../../nodes/Gmx/constants/networks';
import { CONTRACTS, getContractAddresses } from '../../nodes/Gmx/constants/contracts';
import { TOKENS, getTokenConfig, getStableTokens } from '../../nodes/Gmx/constants/tokens';
import { MARKETS, getMarket, getAllMarkets } from '../../nodes/Gmx/constants/markets';

describe('Constants Integration', () => {
  describe('Networks', () => {
    it('should have arbitrum network configured', () => {
      const config = getNetworkConfig('arbitrum');
      expect(config.chainId).toBe(42161);
      expect(config.supportsV1).toBe(true);
      expect(config.supportsV2).toBe(true);
    });

    it('should have avalanche network configured', () => {
      const config = getNetworkConfig('avalanche');
      expect(config.chainId).toBe(43114);
      expect(config.supportsV1).toBe(true);
    });

    it('should throw for unknown network', () => {
      expect(() => getNetworkConfig('unknown')).toThrow();
    });
  });

  describe('Contracts', () => {
    it('should have arbitrum contracts configured', () => {
      const addresses = getContractAddresses('arbitrum');
      expect(addresses.vault).toBeDefined();
      expect(addresses.router).toBeDefined();
      expect(addresses.dataStore).toBeDefined();
    });

    it('should have avalanche contracts configured', () => {
      const addresses = getContractAddresses('avalanche');
      expect(addresses.vault).toBeDefined();
    });
  });

  describe('Tokens', () => {
    it('should have ETH configured for arbitrum', () => {
      const eth = getTokenConfig('arbitrum', 'ETH');
      expect(eth).toBeDefined();
      expect(eth?.decimals).toBe(18);
      expect(eth?.isStable).toBe(false);
    });

    it('should have USDC configured for arbitrum', () => {
      const usdc = getTokenConfig('arbitrum', 'USDC');
      expect(usdc).toBeDefined();
      expect(usdc?.decimals).toBe(6);
      expect(usdc?.isStable).toBe(true);
    });

    it('should return stable tokens for arbitrum', () => {
      const stableTokens = getStableTokens('arbitrum');
      expect(stableTokens.length).toBeGreaterThan(0);
      expect(stableTokens.every((t) => t.isStable)).toBe(true);
    });
  });

  describe('Markets', () => {
    it('should have ETH/USD market for arbitrum', () => {
      const market = getMarket('arbitrum', 'ETH/USD');
      expect(market).toBeDefined();
      expect(market?.maxLeverage).toBe(100);
    });

    it('should return all markets for arbitrum', () => {
      const markets = getAllMarkets('arbitrum');
      expect(markets.length).toBeGreaterThan(0);
    });
  });
});

describe('Client Configuration', () => {
  it('should export GmxV1Client', async () => {
    const { GmxV1Client } = await import('../../nodes/Gmx/transport/gmxV1Client');
    expect(GmxV1Client).toBeDefined();
  });

  it('should export GmxV2Client', async () => {
    const { GmxV2Client } = await import('../../nodes/Gmx/transport/gmxV2Client');
    expect(GmxV2Client).toBeDefined();
  });

  it('should export SubgraphClient', async () => {
    const { SubgraphClient } = await import('../../nodes/Gmx/transport/subgraphClient');
    expect(SubgraphClient).toBeDefined();
  });
});
