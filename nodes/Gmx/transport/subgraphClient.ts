/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { request, gql } from 'graphql-request';
import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { getNetworkConfig } from '../constants/networks';
import { SUBGRAPH_FRAGMENTS } from '../constants';

export interface SubgraphClientConfig {
  network: string;
  version: 'v1' | 'v2';
  customEndpoint?: string;
}

export interface TradeData {
  id: string;
  account: string;
  market?: string;
  indexToken?: string;
  collateralToken: string;
  isLong: boolean;
  sizeDelta: string;
  collateralDelta: string;
  fee: string;
  pnl?: string;
  priceImpact?: string;
  timestamp: string;
  txHash: string;
}

export interface VolumeStats {
  period: string;
  volume: string;
  margin: string;
  swap: string;
  mint: string;
  burn: string;
  liquidation: string;
}

export interface FeeStats {
  period: string;
  marginAndLiquidation: string;
  swap: string;
  mint: string;
  burn: string;
  total: string;
}

export interface PositionData {
  id: string;
  key: string;
  account: string;
  market: string;
  collateralToken: string;
  sizeInUsd: string;
  sizeInTokens: string;
  collateralAmount: string;
  isLong: boolean;
  borrowingFactor: string;
  fundingFeeAmountPerSize: string;
  increasedAtBlock: string;
  decreasedAtBlock: string;
}

export interface OrderData {
  id: string;
  key: string;
  account: string;
  market: string;
  initialCollateralToken: string;
  sizeDeltaUsd: string;
  orderType: number;
  isLong: boolean;
  triggerPrice: string;
  acceptablePrice: string;
  createdAtBlock: string;
  createdAtTime: string;
}

export interface LiquidationData {
  id: string;
  account: string;
  market: string;
  collateralToken: string;
  sizeInUsd: string;
  collateralAmount: string;
  isLong: boolean;
  borrowingFeeUsd: string;
  fundingFeeAmount: string;
  pnlUsd: string;
  timestamp: string;
  txHash: string;
}

/**
 * GMX Subgraph Client for querying historical data and analytics
 */
export class SubgraphClient {
  private endpoint: string;
  private network: string;
  private version: 'v1' | 'v2';

  constructor(config: SubgraphClientConfig) {
    this.network = config.network;
    this.version = config.version;

    if (config.customEndpoint) {
      this.endpoint = config.customEndpoint;
    } else {
      const networkConfig = getNetworkConfig(config.network);
      this.endpoint =
        config.version === 'v1'
          ? networkConfig.subgraphUrls.v1Stats
          : networkConfig.subgraphUrls.v2Stats;
    }
  }

  /**
   * Execute a custom GraphQL query
   */
  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    return await request<T>(this.endpoint, query, variables);
  }

  /**
   * Get trades for an account
   */
  async getTrades(
    account: string,
    first: number = 100,
    skip: number = 0,
  ): Promise<TradeData[]> {
    const query = gql`
      query GetTrades($account: String!, $first: Int!, $skip: Int!) {
        trades(
          where: { account: $account }
          first: $first
          skip: $skip
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          account
          collateralToken
          indexToken
          isLong
          sizeDelta
          collateralDelta
          fee
          timestamp
          txHash: transactionHash
        }
      }
    `;

    const result = await this.query<{ trades: TradeData[] }>(query, {
      account: account.toLowerCase(),
      first,
      skip,
    });

    return result.trades;
  }

  /**
   * Get positions for an account (V2)
   */
  async getPositions(
    account: string,
    first: number = 100,
    skip: number = 0,
  ): Promise<PositionData[]> {
    const query = gql`
      query GetPositions($account: String!, $first: Int!, $skip: Int!) {
        positions(
          where: { account: $account }
          first: $first
          skip: $skip
          orderBy: increasedAtBlock
          orderDirection: desc
        ) {
          ${SUBGRAPH_FRAGMENTS.POSITION_FIELDS}
        }
      }
    `;

    const result = await this.query<{ positions: PositionData[] }>(query, {
      account: account.toLowerCase(),
      first,
      skip,
    });

    return result.positions;
  }

  /**
   * Get orders for an account (V2)
   */
  async getOrders(
    account: string,
    first: number = 100,
    skip: number = 0,
  ): Promise<OrderData[]> {
    const query = gql`
      query GetOrders($account: String!, $first: Int!, $skip: Int!) {
        orders(
          where: { account: $account }
          first: $first
          skip: $skip
          orderBy: createdAtBlock
          orderDirection: desc
        ) {
          ${SUBGRAPH_FRAGMENTS.ORDER_FIELDS}
        }
      }
    `;

    const result = await this.query<{ orders: OrderData[] }>(query, {
      account: account.toLowerCase(),
      first,
      skip,
    });

    return result.orders;
  }

  /**
   * Get liquidations for an account
   */
  async getLiquidations(
    account: string,
    first: number = 100,
    skip: number = 0,
  ): Promise<LiquidationData[]> {
    const query = gql`
      query GetLiquidations($account: String!, $first: Int!, $skip: Int!) {
        liquidations(
          where: { account: $account }
          first: $first
          skip: $skip
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          account
          market
          collateralToken
          sizeInUsd
          collateralAmount
          isLong
          borrowingFeeUsd
          fundingFeeAmount
          pnlUsd
          timestamp
          txHash: transactionHash
        }
      }
    `;

    const result = await this.query<{ liquidations: LiquidationData[] }>(query, {
      account: account.toLowerCase(),
      first,
      skip,
    });

    return result.liquidations;
  }

  /**
   * Get volume stats
   */
  async getVolumeStats(period: string = 'daily'): Promise<VolumeStats[]> {
    const query = gql`
      query GetVolumeStats($period: String!) {
        volumeStats(where: { period: $period }, orderBy: id, orderDirection: desc, first: 30) {
          period
          volume: margin
          margin
          swap
          mint
          burn
          liquidation
        }
      }
    `;

    const result = await this.query<{ volumeStats: VolumeStats[] }>(query, { period });
    return result.volumeStats;
  }

  /**
   * Get fee stats
   */
  async getFeeStats(period: string = 'daily'): Promise<FeeStats[]> {
    const query = gql`
      query GetFeeStats($period: String!) {
        feeStats(where: { period: $period }, orderBy: id, orderDirection: desc, first: 30) {
          period
          marginAndLiquidation
          swap
          mint
          burn
          total
        }
      }
    `;

    const result = await this.query<{ feeStats: FeeStats[] }>(query, { period });
    return result.feeStats;
  }

  /**
   * Get total volume
   */
  async getTotalVolume(): Promise<string> {
    const query = gql`
      query GetTotalVolume {
        volumeStats(first: 1, orderBy: id, orderDirection: desc) {
          volume: margin
        }
      }
    `;

    const result = await this.query<{ volumeStats: { volume: string }[] }>(query);
    return result.volumeStats[0]?.volume || '0';
  }

  /**
   * Get open interest
   */
  async getOpenInterest(): Promise<{ long: string; short: string }> {
    const query = gql`
      query GetOpenInterest {
        openInterestStats(first: 1, orderBy: id, orderDirection: desc) {
          longOpenInterest
          shortOpenInterest
        }
      }
    `;

    const result = await this.query<{
      openInterestStats: { longOpenInterest: string; shortOpenInterest: string }[];
    }>(query);

    return {
      long: result.openInterestStats[0]?.longOpenInterest || '0',
      short: result.openInterestStats[0]?.shortOpenInterest || '0',
    };
  }

  /**
   * Get user stats
   */
  async getUserStats(account: string): Promise<{
    totalTrades: number;
    totalVolume: string;
    totalPnl: string;
    totalFees: string;
  }> {
    const query = gql`
      query GetUserStats($account: String!) {
        userStat(id: $account) {
          totalTrades
          totalVolume
          totalPnl
          totalFees
        }
      }
    `;

    const result = await this.query<{
      userStat: {
        totalTrades: number;
        totalVolume: string;
        totalPnl: string;
        totalFees: string;
      } | null;
    }>(query, { account: account.toLowerCase() });

    return (
      result.userStat || {
        totalTrades: 0,
        totalVolume: '0',
        totalPnl: '0',
        totalFees: '0',
      }
    );
  }

  /**
   * Get funding rates history
   */
  async getFundingRates(
    market: string,
    first: number = 100,
    skip: number = 0,
  ): Promise<{ timestamp: string; fundingRate: string; longPayShort: boolean }[]> {
    const query = gql`
      query GetFundingRates($market: String!, $first: Int!, $skip: Int!) {
        fundingRates(
          where: { market: $market }
          first: $first
          skip: $skip
          orderBy: timestamp
          orderDirection: desc
        ) {
          timestamp
          fundingRate
          longPayShort
        }
      }
    `;

    const result = await this.query<{
      fundingRates: { timestamp: string; fundingRate: string; longPayShort: boolean }[];
    }>(query, { market: market.toLowerCase(), first, skip });

    return result.fundingRates;
  }

  /**
   * Get GLP stats (V1)
   */
  async getGlpStats(): Promise<{
    glpSupply: string;
    aumInUsdg: string;
    glpPrice: string;
  }> {
    const query = gql`
      query GetGlpStats {
        glpStat(id: "total") {
          glpSupply
          aumInUsdg
        }
      }
    `;

    const result = await this.query<{
      glpStat: { glpSupply: string; aumInUsdg: string } | null;
    }>(query);

    const glpSupply = result.glpStat?.glpSupply || '0';
    const aumInUsdg = result.glpStat?.aumInUsdg || '0';
    const glpPrice =
      BigInt(glpSupply) > 0
        ? ((BigInt(aumInUsdg) * BigInt(10) ** BigInt(18)) / BigInt(glpSupply)).toString()
        : '0';

    return {
      glpSupply,
      aumInUsdg,
      glpPrice,
    };
  }

  /**
   * Get protocol TVL
   */
  async getTvl(): Promise<string> {
    const query = gql`
      query GetTvl {
        protocolMetrics(first: 1, orderBy: timestamp, orderDirection: desc) {
          tvl
        }
      }
    `;

    const result = await this.query<{ protocolMetrics: { tvl: string }[] }>(query);
    return result.protocolMetrics[0]?.tvl || '0';
  }

  /**
   * Get the subgraph status
   */
  async getStatus(): Promise<{ synced: boolean; latestBlock: number }> {
    const query = gql`
      query GetStatus {
        _meta {
          block {
            number
          }
          hasIndexingErrors
        }
      }
    `;

    const result = await this.query<{
      _meta: { block: { number: number }; hasIndexingErrors: boolean };
    }>(query);

    return {
      synced: !result._meta.hasIndexingErrors,
      latestBlock: result._meta.block.number,
    };
  }
}

/**
 * Create a subgraph client from n8n credentials
 */
export async function createSubgraphClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialName: string = 'gmxNetwork',
): Promise<SubgraphClient> {
  const credentials = await context.getCredentials(credentialName);

  const network = credentials.network as string;
  const version = (credentials.protocolVersion as 'v1' | 'v2') || 'v2';
  const customEndpoint = credentials.subgraphUrl as string | undefined;

  return new SubgraphClient({
    network,
    version,
    customEndpoint: customEndpoint || undefined,
  });
}
