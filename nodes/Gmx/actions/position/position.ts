/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV1Client, createGmxV2Client } from '../../transport';
import { calculatePnl, calculateLiquidationPrice, getPositionKey } from '../../utils/positionUtils';
import { calculateLeverage } from '../../utils/leverageUtils';
import { PRECISION } from '../../constants';

export const positionOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['position'],
      },
    },
    options: [
      {
        name: 'Get Positions',
        value: 'getPositions',
        description: 'Get all positions for an account',
        action: 'Get positions',
      },
      {
        name: 'Get Position by Key',
        value: 'getPositionByKey',
        description: 'Get a specific position by its key',
        action: 'Get position by key',
      },
      {
        name: 'Get Position PnL',
        value: 'getPositionPnl',
        description: 'Calculate PnL for a position',
        action: 'Get position pnl',
      },
      {
        name: 'Get Liquidation Price',
        value: 'getLiquidationPrice',
        description: 'Calculate liquidation price for a position',
        action: 'Get liquidation price',
      },
      {
        name: 'Increase Position',
        value: 'increasePosition',
        description: 'Open or increase a position',
        action: 'Increase position',
      },
      {
        name: 'Decrease Position',
        value: 'decreasePosition',
        description: 'Reduce or close a position',
        action: 'Decrease position',
      },
      {
        name: 'Close Position',
        value: 'closePosition',
        description: 'Close an entire position',
        action: 'Close position',
      },
    ],
    default: 'getPositions',
  },
];

export const positionFields: INodeProperties[] = [
  {
    displayName: 'Account Address',
    name: 'accountAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['getPositions', 'getPositionByKey', 'getPositionPnl', 'getLiquidationPrice'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The account address to query positions for',
  },
  {
    displayName: 'Position Key',
    name: 'positionKey',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['getPositionByKey'],
      },
    },
    default: '',
    description: 'The unique key identifying the position',
  },
  {
    displayName: 'Market Address',
    name: 'marketAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['increasePosition', 'decreasePosition', 'closePosition', 'getPositionPnl', 'getLiquidationPrice'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The market address (GM token for V2)',
  },
  {
    displayName: 'Collateral Token',
    name: 'collateralToken',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['increasePosition', 'decreasePosition', 'closePosition'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The collateral token address',
  },
  {
    displayName: 'Is Long',
    name: 'isLong',
    type: 'boolean',
    required: true,
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['increasePosition', 'decreasePosition', 'closePosition', 'getPositionPnl', 'getLiquidationPrice'],
      },
    },
    default: true,
    description: 'Whether this is a long (true) or short (false) position',
  },
  {
    displayName: 'Size Delta (USD)',
    name: 'sizeDeltaUsd',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['increasePosition', 'decreasePosition'],
      },
    },
    default: 0,
    description: 'The size to increase/decrease in USD',
  },
  {
    displayName: 'Collateral Amount',
    name: 'collateralAmount',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['increasePosition'],
      },
    },
    default: '0',
    description: 'The amount of collateral to deposit (in token units)',
  },
  {
    displayName: 'Collateral Delta',
    name: 'collateralDelta',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['decreasePosition'],
      },
    },
    default: '0',
    description: 'The amount of collateral to withdraw (in token units)',
  },
  {
    displayName: 'Slippage (%)',
    name: 'slippagePercent',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['increasePosition', 'decreasePosition', 'closePosition'],
      },
    },
    default: 0.5,
    description: 'Maximum acceptable slippage percentage',
  },
  {
    displayName: 'Execution Fee (ETH)',
    name: 'executionFee',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['position'],
        operation: ['increasePosition', 'decreasePosition', 'closePosition'],
      },
    },
    default: '0.001',
    description: 'Execution fee in ETH for keeper execution',
  },
];

export async function executePositionOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('gmxNetwork');
  const protocolVersion = credentials.protocolVersion as string;

  let result: Record<string, unknown> = {};

  try {
    switch (operation) {
      case 'getPositions': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const positions = await v2Client.getAccountPositions(accountAddress);

          result = {
            account: accountAddress,
            positions: positions.map((p) => ({
              market: p.market,
              collateralToken: p.collateralToken,
              isLong: p.isLong,
              sizeInUsd: (Number(p.sizeInUsd) / Number(PRECISION)).toFixed(2),
              sizeInTokens: p.sizeInTokens.toString(),
              collateralAmount: p.collateralAmount.toString(),
              leverage: calculateLeverage({
                size: p.sizeInUsd,
                collateral: p.collateralAmount * BigInt(10) ** BigInt(24), // Adjust for decimals
              }).toFixed(2) + 'x',
              borrowingFactor: p.borrowingFactor.toString(),
            })),
            count: positions.length,
          };
        } else {
          const v1Client = await createGmxV1Client(this);
          // V1 requires knowing the specific tokens - return general info
          result = {
            account: accountAddress,
            message: 'V1 positions require specific collateral/index token queries. Use getPositionByKey with token addresses.',
          };
        }
        break;
      }

      case 'getPositionByKey': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const positionKey = this.getNodeParameter('positionKey', index) as string;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const positions = await v2Client.getAccountPositions(accountAddress);
          
          // Find position matching the key (simplified - in production would use reader contract)
          const position = positions.find((p) => {
            const key = getPositionKey(p.account, p.collateralToken, p.market, p.isLong);
            return key.toLowerCase() === positionKey.toLowerCase();
          });

          if (!position) {
            throw new NodeOperationError(this.getNode(), 'Position not found');
          }

          result = {
            key: positionKey,
            ...position,
            sizeInUsd: (Number(position.sizeInUsd) / Number(PRECISION)).toFixed(2),
          };
        } else {
          throw new NodeOperationError(
            this.getNode(),
            'getPositionByKey requires V2. For V1, use specific token addresses.',
          );
        }
        break;
      }

      case 'getPositionPnl': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const isLong = this.getNodeParameter('isLong', index) as boolean;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const positions = await v2Client.getAccountPositions(accountAddress);

          const position = positions.find(
            (p) => p.market.toLowerCase() === marketAddress.toLowerCase() && p.isLong === isLong,
          );

          if (!position) {
            throw new NodeOperationError(this.getNode(), 'Position not found');
          }

          // Get current price for PnL calculation
          const market = await v2Client.getMarket(marketAddress);
          const price = await v2Client.getOraclePrice(market.indexToken);

          result = {
            account: accountAddress,
            market: marketAddress,
            isLong,
            sizeInUsd: (Number(position.sizeInUsd) / Number(PRECISION)).toFixed(2),
            collateralAmount: position.collateralAmount.toString(),
            currentPrice: {
              min: price.min.toString(),
              max: price.max.toString(),
            },
            // PnL calculation would require more detailed position info
            message: 'Use subgraph for detailed PnL history',
          };
        } else {
          throw new NodeOperationError(this.getNode(), 'V1 PnL calculation requires specific token addresses');
        }
        break;
      }

      case 'getLiquidationPrice': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const isLong = this.getNodeParameter('isLong', index) as boolean;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const positions = await v2Client.getAccountPositions(accountAddress);

          const position = positions.find(
            (p) => p.market.toLowerCase() === marketAddress.toLowerCase() && p.isLong === isLong,
          );

          if (!position) {
            throw new NodeOperationError(this.getNode(), 'Position not found');
          }

          // Calculate liquidation price
          const liqResult = calculateLiquidationPrice({
            size: position.sizeInUsd,
            collateral: position.collateralAmount * BigInt(10) ** BigInt(24), // Adjust for decimals
            averagePrice: BigInt(0), // Would need to fetch from position info
            isLong,
            fundingFee: BigInt(0),
            marginFeeBasisPoints: 10, // 0.1%
          });

          result = {
            account: accountAddress,
            market: marketAddress,
            isLong,
            sizeInUsd: (Number(position.sizeInUsd) / Number(PRECISION)).toFixed(2),
            liquidationPrice: liqResult.liquidationPrice.toString(),
            liquidationRisk: liqResult.liquidationRisk,
            isLiquidatable: liqResult.isLiquidatable,
          };
        } else {
          throw new NodeOperationError(this.getNode(), 'V1 liquidation calculation requires specific token addresses');
        }
        break;
      }

      case 'increasePosition': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const collateralToken = this.getNodeParameter('collateralToken', index) as string;
        const isLong = this.getNodeParameter('isLong', index) as boolean;
        const sizeDeltaUsd = this.getNodeParameter('sizeDeltaUsd', index) as number;
        const collateralAmount = this.getNodeParameter('collateralAmount', index) as string;
        const slippagePercent = this.getNodeParameter('slippagePercent', index) as number;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const signerAddress = v2Client.getSignerAddress();

          if (!signerAddress) {
            throw new NodeOperationError(this.getNode(), 'Private key required for trading operations');
          }

          // Get current price for acceptable price calculation
          const market = await v2Client.getMarket(marketAddress);
          const price = await v2Client.getOraclePrice(market.indexToken);
          const currentPrice = isLong ? price.max : price.min;

          // Calculate acceptable price with slippage
          const slippageBps = Math.floor(slippagePercent * 100);
          const acceptablePrice = isLong
            ? currentPrice + (currentPrice * BigInt(slippageBps)) / BigInt(10000)
            : currentPrice - (currentPrice * BigInt(slippageBps)) / BigInt(10000);

          const { ethers } = require('ethers');
          const txHash = await v2Client.createOrder({
            receiver: signerAddress,
            callbackContract: ethers.ZeroAddress,
            uiFeeReceiver: ethers.ZeroAddress,
            market: marketAddress,
            initialCollateralToken: collateralToken,
            swapPath: [],
            sizeDeltaUsd: BigInt(Math.floor(sizeDeltaUsd * 10 ** 30)),
            initialCollateralDeltaAmount: BigInt(collateralAmount),
            triggerPrice: BigInt(0),
            acceptablePrice,
            executionFee: ethers.parseEther(executionFee),
            callbackGasLimit: BigInt(0),
            minOutputAmount: BigInt(0),
            orderType: 2, // MarketIncrease
            decreasePositionSwapType: 0,
            isLong,
            shouldUnwrapNativeToken: false,
            referralCode: ethers.ZeroHash,
            autoCancel: false,
          });

          result = {
            success: true,
            txHash,
            operation: 'increasePosition',
            market: marketAddress,
            sizeDeltaUsd,
            collateralAmount,
            isLong,
          };
        } else {
          throw new NodeOperationError(this.getNode(), 'V1 trading requires different parameters - use V1-specific endpoint');
        }
        break;
      }

      case 'decreasePosition':
      case 'closePosition': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const collateralToken = this.getNodeParameter('collateralToken', index) as string;
        const isLong = this.getNodeParameter('isLong', index) as boolean;
        const slippagePercent = this.getNodeParameter('slippagePercent', index) as number;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        if (protocolVersion === 'v2') {
          const v2Client = await createGmxV2Client(this);
          const signerAddress = v2Client.getSignerAddress();

          if (!signerAddress) {
            throw new NodeOperationError(this.getNode(), 'Private key required for trading operations');
          }

          let sizeDeltaUsd: bigint;
          let collateralDelta: bigint;

          if (operation === 'closePosition') {
            // Get current position to close entirely
            const positions = await v2Client.getAccountPositions(signerAddress);
            const position = positions.find(
              (p) => p.market.toLowerCase() === marketAddress.toLowerCase() && p.isLong === isLong,
            );

            if (!position) {
              throw new NodeOperationError(this.getNode(), 'Position not found');
            }

            sizeDeltaUsd = position.sizeInUsd;
            collateralDelta = position.collateralAmount;
          } else {
            sizeDeltaUsd = BigInt(Math.floor((this.getNodeParameter('sizeDeltaUsd', index) as number) * 10 ** 30));
            collateralDelta = BigInt(this.getNodeParameter('collateralDelta', index) as string);
          }

          // Get current price for acceptable price calculation
          const market = await v2Client.getMarket(marketAddress);
          const price = await v2Client.getOraclePrice(market.indexToken);
          const currentPrice = isLong ? price.min : price.max;

          // Calculate acceptable price with slippage (opposite direction for decrease)
          const slippageBps = Math.floor(slippagePercent * 100);
          const acceptablePrice = isLong
            ? currentPrice - (currentPrice * BigInt(slippageBps)) / BigInt(10000)
            : currentPrice + (currentPrice * BigInt(slippageBps)) / BigInt(10000);

          const { ethers } = require('ethers');
          const txHash = await v2Client.createOrder({
            receiver: signerAddress,
            callbackContract: ethers.ZeroAddress,
            uiFeeReceiver: ethers.ZeroAddress,
            market: marketAddress,
            initialCollateralToken: collateralToken,
            swapPath: [],
            sizeDeltaUsd,
            initialCollateralDeltaAmount: collateralDelta,
            triggerPrice: BigInt(0),
            acceptablePrice,
            executionFee: ethers.parseEther(executionFee),
            callbackGasLimit: BigInt(0),
            minOutputAmount: BigInt(0),
            orderType: 4, // MarketDecrease
            decreasePositionSwapType: 0,
            isLong,
            shouldUnwrapNativeToken: false,
            referralCode: ethers.ZeroHash,
            autoCancel: false,
          });

          result = {
            success: true,
            txHash,
            operation: operation === 'closePosition' ? 'closePosition' : 'decreasePosition',
            market: marketAddress,
            sizeDeltaUsd: (Number(sizeDeltaUsd) / Number(PRECISION)).toFixed(2),
            isLong,
          };
        } else {
          throw new NodeOperationError(this.getNode(), 'V1 trading requires different parameters');
        }
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
