/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV2Client } from '../../transport';
import { PRECISION } from '../../constants';

export const gmOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['gm'],
      },
    },
    options: [
      {
        name: 'Get GM Pools',
        value: 'getGmPools',
        description: 'Get all GM liquidity pools',
        action: 'Get gm pools',
      },
      {
        name: 'Get GM Pool Info',
        value: 'getGmPoolInfo',
        description: 'Get information for a specific GM pool',
        action: 'Get gm pool info',
      },
      {
        name: 'Get GM Balance',
        value: 'getGmBalance',
        description: 'Get GM token balance for an account',
        action: 'Get gm balance',
      },
      {
        name: 'Deposit to GM Pool',
        value: 'depositToGmPool',
        description: 'Deposit tokens to receive GM tokens',
        action: 'Deposit to gm pool',
      },
      {
        name: 'Withdraw from GM Pool',
        value: 'withdrawFromGmPool',
        description: 'Burn GM tokens to receive underlying tokens',
        action: 'Withdraw from gm pool',
      },
    ],
    default: 'getGmPools',
  },
];

export const gmFields: INodeProperties[] = [
  {
    displayName: 'Market Address',
    name: 'marketAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['gm'],
        operation: ['getGmPoolInfo', 'getGmBalance', 'depositToGmPool', 'withdrawFromGmPool'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The GM market/pool address',
  },
  {
    displayName: 'Account Address',
    name: 'accountAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['gm'],
        operation: ['getGmBalance'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The account address to query balance for',
  },
  {
    displayName: 'Long Token Amount',
    name: 'longTokenAmount',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['gm'],
        operation: ['depositToGmPool'],
      },
    },
    default: '0',
    description: 'Amount of long token to deposit',
  },
  {
    displayName: 'Short Token Amount',
    name: 'shortTokenAmount',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['gm'],
        operation: ['depositToGmPool'],
      },
    },
    default: '0',
    description: 'Amount of short token to deposit',
  },
  {
    displayName: 'GM Amount',
    name: 'gmAmount',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['gm'],
        operation: ['withdrawFromGmPool'],
      },
    },
    default: '0',
    description: 'Amount of GM tokens to withdraw/burn',
  },
  {
    displayName: 'Min Market Tokens',
    name: 'minMarketTokens',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['gm'],
        operation: ['depositToGmPool'],
      },
    },
    default: '0',
    description: 'Minimum GM tokens to receive (slippage protection)',
  },
  {
    displayName: 'Execution Fee (ETH)',
    name: 'executionFee',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['gm'],
        operation: ['depositToGmPool', 'withdrawFromGmPool'],
      },
    },
    default: '0.001',
    description: 'Execution fee for keeper',
  },
];

export async function executeGmOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('gmxNetwork');
  const protocolVersion = credentials.protocolVersion as string;

  if (protocolVersion !== 'v2') {
    throw new NodeOperationError(
      this.getNode(),
      'GM operations are only available for GMX V2. For V1, use GLP operations.',
    );
  }

  let result: Record<string, unknown> = {};

  try {
    const v2Client = await createGmxV2Client(this);
    const { ethers } = require('ethers');

    switch (operation) {
      case 'getGmPools': {
        const markets = await v2Client.getMarkets();

        result = {
          pools: markets.map((m) => ({
            marketToken: m.marketToken,
            indexToken: m.indexToken,
            longToken: m.longToken,
            shortToken: m.shortToken,
          })),
          count: markets.length,
        };
        break;
      }

      case 'getGmPoolInfo': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const market = await v2Client.getMarket(marketAddress);

        // Get pool token balances
        const [longTokenBalance, shortTokenBalance] = await Promise.all([
          v2Client.getTokenBalance(market.longToken, market.marketToken),
          v2Client.getTokenBalance(market.shortToken, market.marketToken),
        ]);

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
          poolBalances: {
            longToken: longTokenBalance.toString(),
            shortToken: shortTokenBalance.toString(),
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
        break;
      }

      case 'getGmBalance': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;

        const balance = await v2Client.getTokenBalance(marketAddress, accountAddress);

        result = {
          account: accountAddress,
          market: marketAddress,
          gmBalance: balance.toString(),
          gmBalanceFormatted: (Number(balance) / 10 ** 18).toFixed(4),
        };
        break;
      }

      case 'depositToGmPool': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const longTokenAmount = this.getNodeParameter('longTokenAmount', index) as string;
        const shortTokenAmount = this.getNodeParameter('shortTokenAmount', index) as string;
        const minMarketTokens = this.getNodeParameter('minMarketTokens', index) as string;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        const signerAddress = v2Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for deposits');
        }

        const market = await v2Client.getMarket(marketAddress);

        const txHash = await v2Client.createDeposit({
          receiver: signerAddress,
          callbackContract: ethers.ZeroAddress,
          uiFeeReceiver: ethers.ZeroAddress,
          market: marketAddress,
          initialLongToken: market.longToken,
          initialShortToken: market.shortToken,
          longTokenSwapPath: [],
          shortTokenSwapPath: [],
          minMarketTokens: BigInt(minMarketTokens),
          shouldUnwrapNativeToken: false,
          executionFee: ethers.parseEther(executionFee),
          callbackGasLimit: BigInt(0),
        });

        result = {
          success: true,
          txHash,
          operation: 'deposit',
          market: marketAddress,
          longTokenAmount,
          shortTokenAmount,
        };
        break;
      }

      case 'withdrawFromGmPool': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const gmAmount = this.getNodeParameter('gmAmount', index) as string;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        const signerAddress = v2Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for withdrawals');
        }

        const txHash = await v2Client.createWithdrawal({
          receiver: signerAddress,
          callbackContract: ethers.ZeroAddress,
          uiFeeReceiver: ethers.ZeroAddress,
          market: marketAddress,
          longTokenSwapPath: [],
          shortTokenSwapPath: [],
          minLongTokenAmount: BigInt(0),
          minShortTokenAmount: BigInt(0),
          shouldUnwrapNativeToken: false,
          executionFee: ethers.parseEther(executionFee),
          callbackGasLimit: BigInt(0),
        });

        result = {
          success: true,
          txHash,
          operation: 'withdrawal',
          market: marketAddress,
          gmAmount,
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
