/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV1Client, createGmxV2Client, createSubgraphClient } from '../../transport';
import { PRECISION } from '../../constants';

export const marketOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['market'],
      },
    },
    options: [
      {
        name: 'Get Markets',
        value: 'getMarkets',
        description: 'Get all available markets',
        action: 'Get markets',
      },
      {
        name: 'Get Market Info',
        value: 'getMarketInfo',
        description: 'Get detailed information for a specific market',
        action: 'Get market info',
      },
      {
        name: 'Get Market Prices',
        value: 'getMarketPrices',
        description: 'Get current prices for a market',
        action: 'Get market prices',
      },
      {
        name: 'Get Funding Rate',
        value: 'getFundingRate',
        description: 'Get current funding rate for a market',
        action: 'Get funding rate',
      },
      {
        name: 'Get Open Interest',
        value: 'getOpenInterest',
        description: 'Get open interest for a market',
        action: 'Get open interest',
      },
      {
        name: 'Get Available Liquidity',
        value: 'getAvailableLiquidity',
        description: 'Get available liquidity for a market',
        action: 'Get available liquidity',
      },
      {
        name: 'Get Market Stats',
        value: 'getMarketStats',
        description: 'Get trading statistics for a market',
        action: 'Get market stats',
      },
      {
        name: 'Get 24h Volume',
        value: 'get24hVolume',
        description: 'Get 24 hour trading volume',
        action: 'Get 24h volume',
      },
    ],
    default: 'getMarkets',
  },
];

export const marketFields: INodeProperties[] = [
  {
    displayName: 'Market Address',
    name: 'marketAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['market'],
        operation: ['getMarketInfo', 'getMarketPrices', 'getFundingRate', 'getOpenInterest', 'getAvailableLiquidity'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The market address (GM token address for V2)',
  },
  {
    displayName: 'Token Address',
    name: 'tokenAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['market'],
        operation: ['getFundingRate', 'getAvailableLiquidity'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The token address to query (V1)',
  },
];

export async function executeMarketOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('gmxNetwork');
  const protocolVersion = credentials.protocolVersion as string;

  let result: Record<string, unknown> = {};

  try {
    switch (operation) {
      case 'getMarkets': {
        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const markets = await v2Client.getMarkets();

          result = {
            markets: markets.map((m) => ({
              marketToken: m.marketToken,
              indexToken: m.indexToken,
              longToken: m.longToken,
              shortToken: m.shortToken,
            })),
            count: markets.length,
          };
        } else {
          // V1 doesn't have isolated markets - return supported tokens
          const { TOKENS } = await import('../../constants/tokens');
          const network = credentials.network as string;
          const tokens = TOKENS[network] || {};

          result = {
            message: 'V1 uses a shared liquidity pool (GLP) instead of isolated markets',
            supportedTokens: Object.keys(tokens),
            shortableTokens: Object.values(tokens)
              .filter((t) => t.isShortable)
              .map((t) => t.symbol),
          };
        }
        break;
      }

      case 'getMarketInfo': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const market = await v2Client.getMarket(marketAddress);

          // Get prices
          const [indexPrice, longTokenPrice, shortTokenPrice] = await Promise.all([
            v2Client.getOraclePrice(market.indexToken),
            v2Client.getOraclePrice(market.longToken),
            v2Client.getOraclePrice(market.shortToken),
          ]);

          result = {
            market: {
              marketToken: market.marketToken,
              indexToken: market.indexToken,
              longToken: market.longToken,
              shortToken: market.shortToken,
            },
            prices: {
              indexToken: {
                min: indexPrice.min.toString(),
                max: indexPrice.max.toString(),
              },
              longToken: {
                min: longTokenPrice.min.toString(),
                max: longTokenPrice.max.toString(),
              },
              shortToken: {
                min: shortTokenPrice.min.toString(),
                max: shortTokenPrice.max.toString(),
              },
            },
          };
        } else {
          throw new NodeOperationError(this.getNode(), 'V1 does not have isolated markets. Use token-specific queries.');
        }
        break;
      }

      case 'getMarketPrices': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const market = await v2Client.getMarket(marketAddress);
          const price = await v2Client.getOraclePrice(market.indexToken);

          result = {
            market: marketAddress,
            indexToken: market.indexToken,
            price: {
              min: price.min.toString(),
              max: price.max.toString(),
              mid: ((price.min + price.max) / BigInt(2)).toString(),
            },
          };
        } else {
          const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
          const v1Client = await createGmxV1Client(this);

          const [minPrice, maxPrice] = await Promise.all([
            v1Client.getTokenPrice(tokenAddress, false),
            v1Client.getTokenPrice(tokenAddress, true),
          ]);

          result = {
            token: tokenAddress,
            price: {
              min: minPrice.toString(),
              max: maxPrice.toString(),
              mid: ((minPrice + maxPrice) / BigInt(2)).toString(),
            },
          };
        }
        break;
      }

      case 'getFundingRate': {
        if (protocolVersion === 'v2') {
          const marketAddress = this.getNodeParameter('marketAddress', index) as string;
          const subgraphClient = await createSubgraphClient(this);
          const fundingRates = await subgraphClient.getFundingRates(marketAddress, 10);

          result = {
            market: marketAddress,
            fundingRates: fundingRates,
            currentRate: fundingRates[0] || null,
          };
        } else {
          const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
          const v1Client = await createGmxV1Client(this);

          const [cumulativeRate, nextRate] = await Promise.all([
            v1Client.getFundingRate(tokenAddress),
            v1Client.getNextFundingRate(tokenAddress),
          ]);

          result = {
            token: tokenAddress,
            cumulativeFundingRate: cumulativeRate.toString(),
            nextFundingRate: nextRate.toString(),
          };
        }
        break;
      }

      case 'getOpenInterest': {
        const subgraphClient = await createSubgraphClient(this);
        const openInterest = await subgraphClient.getOpenInterest();

        result = {
          longOpenInterest: openInterest.long,
          shortOpenInterest: openInterest.short,
          totalOpenInterest: (BigInt(openInterest.long) + BigInt(openInterest.short)).toString(),
        };
        break;
      }

      case 'getAvailableLiquidity': {
        if (protocolVersion === 'v2') {
          const marketAddress = this.getNodeParameter('marketAddress', index) as string;
          const v2Client = await createGmxV2Client(this);
          const market = await v2Client.getMarket(marketAddress);

          // Get token balances in the pool
          const [longTokenBalance, shortTokenBalance] = await Promise.all([
            v2Client.getTokenBalance(market.longToken, market.marketToken),
            v2Client.getTokenBalance(market.shortToken, market.marketToken),
          ]);

          result = {
            market: marketAddress,
            longToken: {
              address: market.longToken,
              balance: longTokenBalance.toString(),
            },
            shortToken: {
              address: market.shortToken,
              balance: shortTokenBalance.toString(),
            },
          };
        } else {
          const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
          const v1Client = await createGmxV1Client(this);

          const [poolAmount, reservedAmount] = await Promise.all([
            v1Client.getPoolAmount(tokenAddress),
            v1Client.getReservedAmount(tokenAddress),
          ]);

          const availableLiquidity = poolAmount - reservedAmount;

          result = {
            token: tokenAddress,
            poolAmount: poolAmount.toString(),
            reservedAmount: reservedAmount.toString(),
            availableLiquidity: availableLiquidity.toString(),
            utilizationRate: poolAmount > BigInt(0)
              ? ((reservedAmount * BigInt(10000)) / poolAmount).toString()
              : '0',
          };
        }
        break;
      }

      case 'getMarketStats': {
        const subgraphClient = await createSubgraphClient(this);
        const [volumeStats, feeStats, openInterest] = await Promise.all([
          subgraphClient.getVolumeStats('daily'),
          subgraphClient.getFeeStats('daily'),
          subgraphClient.getOpenInterest(),
        ]);

        result = {
          volume: volumeStats.slice(0, 7), // Last 7 days
          fees: feeStats.slice(0, 7),
          openInterest,
        };
        break;
      }

      case 'get24hVolume': {
        const subgraphClient = await createSubgraphClient(this);
        const volumeStats = await subgraphClient.getVolumeStats('daily');
        const todayVolume = volumeStats[0];

        result = {
          period: '24h',
          totalVolume: todayVolume?.volume || '0',
          marginVolume: todayVolume?.margin || '0',
          swapVolume: todayVolume?.swap || '0',
          mintVolume: todayVolume?.mint || '0',
          burnVolume: todayVolume?.burn || '0',
          liquidationVolume: todayVolume?.liquidation || '0',
        };
        break;
      }

      default:
        throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
    }

    return [{ json: result }];
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to execute ${operation}: ${(error as Error).message}`,
    );
  }
}
