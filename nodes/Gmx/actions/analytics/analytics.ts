/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createSubgraphClient } from '../../transport';

export const analyticsOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['analytics'],
      },
    },
    options: [
      {
        name: 'Get Protocol TVL',
        value: 'getTvl',
        description: 'Get total value locked in the protocol',
        action: 'Get protocol tvl',
      },
      {
        name: 'Get Total Volume',
        value: 'getTotalVolume',
        description: 'Get total trading volume',
        action: 'Get total volume',
      },
      {
        name: 'Get Open Interest Stats',
        value: 'getOpenInterestStats',
        description: 'Get open interest statistics',
        action: 'Get open interest stats',
      },
      {
        name: 'Get Fee Revenue',
        value: 'getFeeRevenue',
        description: 'Get fee revenue statistics',
        action: 'Get fee revenue',
      },
      {
        name: 'Get User Stats',
        value: 'getUserStats',
        description: 'Get statistics for a specific user',
        action: 'Get user stats',
      },
      {
        name: 'Get Volume Stats',
        value: 'getVolumeStats',
        description: 'Get historical volume statistics',
        action: 'Get volume stats',
      },
      {
        name: 'Get Subgraph Status',
        value: 'getSubgraphStatus',
        description: 'Check the status of the subgraph',
        action: 'Get subgraph status',
      },
    ],
    default: 'getTvl',
  },
];

export const analyticsFields: INodeProperties[] = [
  {
    displayName: 'Account Address',
    name: 'accountAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['analytics'],
        operation: ['getUserStats'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The account address to query stats for',
  },
  {
    displayName: 'Period',
    name: 'period',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['analytics'],
        operation: ['getVolumeStats', 'getFeeRevenue'],
      },
    },
    options: [
      { name: 'Daily', value: 'daily' },
      { name: 'Weekly', value: 'weekly' },
      { name: 'Total', value: 'total' },
    ],
    default: 'daily',
    description: 'The time period for statistics',
  },
];

export async function executeAnalyticsOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;

  let result: Record<string, unknown> = {};

  try {
    const subgraphClient = await createSubgraphClient(this);

    switch (operation) {
      case 'getTvl': {
        const tvl = await subgraphClient.getTvl();

        result = {
          tvl,
          tvlFormatted: `$${(Number(tvl) / 10 ** 30).toLocaleString()}`,
        };
        break;
      }

      case 'getTotalVolume': {
        const volume = await subgraphClient.getTotalVolume();

        result = {
          totalVolume: volume,
          totalVolumeFormatted: `$${(Number(volume) / 10 ** 30).toLocaleString()}`,
        };
        break;
      }

      case 'getOpenInterestStats': {
        const openInterest = await subgraphClient.getOpenInterest();

        const longOI = BigInt(openInterest.long);
        const shortOI = BigInt(openInterest.short);
        const totalOI = longOI + shortOI;

        result = {
          longOpenInterest: openInterest.long,
          shortOpenInterest: openInterest.short,
          totalOpenInterest: totalOI.toString(),
          longOpenInterestFormatted: `$${(Number(longOI) / 10 ** 30).toLocaleString()}`,
          shortOpenInterestFormatted: `$${(Number(shortOI) / 10 ** 30).toLocaleString()}`,
          totalOpenInterestFormatted: `$${(Number(totalOI) / 10 ** 30).toLocaleString()}`,
          longShortRatio: shortOI > BigInt(0)
            ? (Number(longOI) / Number(shortOI)).toFixed(2)
            : 'N/A',
        };
        break;
      }

      case 'getFeeRevenue': {
        const period = this.getNodeParameter('period', index) as string;
        const feeStats = await subgraphClient.getFeeStats(period);

        result = {
          period,
          feeStats: feeStats.map((stat) => ({
            ...stat,
            totalFormatted: `$${(Number(stat.total) / 10 ** 30).toLocaleString()}`,
          })),
          latestTotal: feeStats[0]?.total || '0',
        };
        break;
      }

      case 'getUserStats': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const userStats = await subgraphClient.getUserStats(accountAddress);

        result = {
          account: accountAddress,
          ...userStats,
          totalVolumeFormatted: `$${(Number(userStats.totalVolume) / 10 ** 30).toLocaleString()}`,
          totalPnlFormatted: `$${(Number(userStats.totalPnl) / 10 ** 30).toLocaleString()}`,
          totalFeesFormatted: `$${(Number(userStats.totalFees) / 10 ** 30).toLocaleString()}`,
        };
        break;
      }

      case 'getVolumeStats': {
        const period = this.getNodeParameter('period', index) as string;
        const volumeStats = await subgraphClient.getVolumeStats(period);

        result = {
          period,
          volumeStats: volumeStats.map((stat) => ({
            ...stat,
            volumeFormatted: `$${(Number(stat.volume) / 10 ** 30).toLocaleString()}`,
          })),
          latestVolume: volumeStats[0]?.volume || '0',
        };
        break;
      }

      case 'getSubgraphStatus': {
        const status = await subgraphClient.getStatus();

        result = {
          synced: status.synced,
          latestBlock: status.latestBlock,
          status: status.synced ? 'healthy' : 'syncing',
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
