/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV1Client, createGmxV2Client, createSubgraphClient } from '../../transport';
import { formatPrice } from '../../utils/priceUtils';
import { PRECISION } from '../../constants';

export const accountOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['account'],
      },
    },
    options: [
      {
        name: 'Get Account Overview',
        value: 'getOverview',
        description: 'Get comprehensive account overview including positions, orders, and stats',
        action: 'Get account overview',
      },
      {
        name: 'Get Positions',
        value: 'getPositions',
        description: 'Get all open positions for an account',
        action: 'Get account positions',
      },
      {
        name: 'Get Orders',
        value: 'getOrders',
        description: 'Get all open orders for an account',
        action: 'Get account orders',
      },
      {
        name: 'Get Trades',
        value: 'getTrades',
        description: 'Get trade history for an account',
        action: 'Get account trades',
      },
      {
        name: 'Get PnL',
        value: 'getPnl',
        description: 'Get profit and loss summary for an account',
        action: 'Get account pnl',
      },
      {
        name: 'Get Collateral',
        value: 'getCollateral',
        description: 'Get collateral balances for an account',
        action: 'Get account collateral',
      },
      {
        name: 'Get Referral Info',
        value: 'getReferralInfo',
        description: 'Get referral information for an account',
        action: 'Get referral info',
      },
      {
        name: 'Get Stats',
        value: 'getStats',
        description: 'Get trading statistics for an account',
        action: 'Get account stats',
      },
    ],
    default: 'getOverview',
  },
];

export const accountFields: INodeProperties[] = [
  {
    displayName: 'Account Address',
    name: 'accountAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['account'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The Ethereum address of the account to query',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['getTrades', 'getPositions', 'getOrders'],
      },
    },
    default: 100,
    description: 'Maximum number of results to return',
  },
  {
    displayName: 'Offset',
    name: 'offset',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['getTrades', 'getPositions', 'getOrders'],
      },
    },
    default: 0,
    description: 'Number of results to skip for pagination',
  },
];

export async function executeAccountOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const accountAddress = this.getNodeParameter('accountAddress', index) as string;
  const credentials = await this.getCredentials('gmxNetwork');
  const protocolVersion = credentials.protocolVersion as string;

  let result: Record<string, unknown> = {};

  try {
    switch (operation) {
      case 'getOverview': {
        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const subgraphClient = await createSubgraphClient(this);

          const [positions, orders, userStats] = await Promise.all([
            v2Client.getAccountPositions(accountAddress),
            v2Client.getAccountOrders(accountAddress),
            subgraphClient.getUserStats(accountAddress),
          ]);

          result = {
            account: accountAddress,
            protocolVersion: 'v2',
            positions: positions.map((p) => ({
              market: p.market,
              isLong: p.isLong,
              sizeInUsd: (Number(p.sizeInUsd) / Number(PRECISION)).toFixed(2),
              collateralAmount: p.collateralAmount.toString(),
            })),
            openPositionCount: positions.length,
            orders: orders.map((o) => ({
              key: o.key,
              market: o.market,
              orderType: o.orderType,
              isLong: o.isLong,
              sizeDeltaUsd: (Number(o.sizeDeltaUsd) / Number(PRECISION)).toFixed(2),
            })),
            openOrderCount: orders.length,
            stats: userStats,
          };
        } else {
          const v1Client = await createGmxV1Client(this);
          const subgraphClient = await createSubgraphClient(this);

          const [stakingInfo, referralInfo, userStats] = await Promise.all([
            v1Client.getStakingInfo(accountAddress),
            v1Client.getReferralInfo(accountAddress),
            subgraphClient.getUserStats(accountAddress),
          ]);

          result = {
            account: accountAddress,
            protocolVersion: 'v1',
            staking: {
              stakedGmx: stakingInfo.stakedGmx.toString(),
              esGmxBalance: stakingInfo.esGmxBalance.toString(),
              claimableEth: stakingInfo.claimableEth.toString(),
              claimableEsGmx: stakingInfo.claimableEsGmx.toString(),
            },
            referral: referralInfo,
            stats: userStats,
          };
        }
        break;
      }

      case 'getPositions': {
        const limit = this.getNodeParameter('limit', index) as number;
        const offset = this.getNodeParameter('offset', index) as number;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const positions = await v2Client.getAccountPositions(accountAddress, offset, offset + limit);

          result = {
            account: accountAddress,
            positions: positions.map((p) => ({
              market: p.market,
              collateralToken: p.collateralToken,
              isLong: p.isLong,
              sizeInUsd: (Number(p.sizeInUsd) / Number(PRECISION)).toFixed(2),
              sizeInTokens: p.sizeInTokens.toString(),
              collateralAmount: p.collateralAmount.toString(),
              borrowingFactor: p.borrowingFactor.toString(),
              increasedAtBlock: p.increasedAtBlock.toString(),
            })),
            count: positions.length,
          };
        } else {
          const subgraphClient = await createSubgraphClient(this);
          const positions = await subgraphClient.getPositions(accountAddress, limit, offset);

          result = {
            account: accountAddress,
            positions,
            count: positions.length,
          };
        }
        break;
      }

      case 'getOrders': {
        const limit = this.getNodeParameter('limit', index) as number;
        const offset = this.getNodeParameter('offset', index) as number;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const orders = await v2Client.getAccountOrders(accountAddress, offset, offset + limit);

          result = {
            account: accountAddress,
            orders: orders.map((o) => ({
              key: o.key,
              market: o.market,
              initialCollateralToken: o.initialCollateralToken,
              orderType: o.orderType,
              isLong: o.isLong,
              sizeDeltaUsd: (Number(o.sizeDeltaUsd) / Number(PRECISION)).toFixed(2),
              triggerPrice: o.triggerPrice.toString(),
              acceptablePrice: o.acceptablePrice.toString(),
              executionFee: o.executionFee.toString(),
              isFrozen: o.isFrozen,
            })),
            count: orders.length,
          };
        } else {
          const subgraphClient = await createSubgraphClient(this);
          const orders = await subgraphClient.getOrders(accountAddress, limit, offset);

          result = {
            account: accountAddress,
            orders,
            count: orders.length,
          };
        }
        break;
      }

      case 'getTrades': {
        const limit = this.getNodeParameter('limit', index) as number;
        const offset = this.getNodeParameter('offset', index) as number;

        const subgraphClient = await createSubgraphClient(this);
        const trades = await subgraphClient.getTrades(accountAddress, limit, offset);

        result = {
          account: accountAddress,
          trades,
          count: trades.length,
        };
        break;
      }

      case 'getPnl': {
        const subgraphClient = await createSubgraphClient(this);
        const userStats = await subgraphClient.getUserStats(accountAddress);

        result = {
          account: accountAddress,
          totalPnl: userStats.totalPnl,
          totalVolume: userStats.totalVolume,
          totalTrades: userStats.totalTrades,
          totalFees: userStats.totalFees,
        };
        break;
      }

      case 'getCollateral': {
        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const positions = await v2Client.getAccountPositions(accountAddress);

          const collateralByToken: Record<string, bigint> = {};
          for (const pos of positions) {
            const token = pos.collateralToken;
            collateralByToken[token] = (collateralByToken[token] || BigInt(0)) + pos.collateralAmount;
          }

          result = {
            account: accountAddress,
            collateral: Object.entries(collateralByToken).map(([token, amount]) => ({
              token,
              amount: amount.toString(),
            })),
          };
        } else {
          result = {
            account: accountAddress,
            message: 'Use getPositions to see collateral in V1 positions',
          };
        }
        break;
      }

      case 'getReferralInfo': {
        const v1Client = await createGmxV1Client(this);
        const referralInfo = await v1Client.getReferralInfo(accountAddress);

        result = {
          account: accountAddress,
          referralCode: referralInfo.code,
          referrer: referralInfo.referrer,
        };
        break;
      }

      case 'getStats': {
        const subgraphClient = await createSubgraphClient(this);
        const userStats = await subgraphClient.getUserStats(accountAddress);

        result = {
          account: accountAddress,
          ...userStats,
        };
        break;
      }

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }

    return [{ json: result }];
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to execute ${operation}: ${(error as Error).message}`,
    );
  }
}
