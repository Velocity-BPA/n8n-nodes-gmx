/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV2Client, createSubgraphClient } from '../../transport';
import { OrderType, DecreasePositionSwapType, PRECISION } from '../../constants';

export const orderOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['order'],
      },
    },
    options: [
      {
        name: 'Create Market Order',
        value: 'createMarketOrder',
        description: 'Create a market order for immediate execution',
        action: 'Create market order',
      },
      {
        name: 'Create Limit Order',
        value: 'createLimitOrder',
        description: 'Create a limit order at specified price',
        action: 'Create limit order',
      },
      {
        name: 'Create Stop-Loss Order',
        value: 'createStopLoss',
        description: 'Create a stop-loss order',
        action: 'Create stop loss order',
      },
      {
        name: 'Create Take-Profit Order',
        value: 'createTakeProfit',
        description: 'Create a take-profit order',
        action: 'Create take profit order',
      },
      {
        name: 'Get Orders',
        value: 'getOrders',
        description: 'Get all orders for an account',
        action: 'Get orders',
      },
      {
        name: 'Get Order',
        value: 'getOrder',
        description: 'Get a specific order by key',
        action: 'Get order',
      },
      {
        name: 'Cancel Order',
        value: 'cancelOrder',
        description: 'Cancel an existing order',
        action: 'Cancel order',
      },
      {
        name: 'Update Order',
        value: 'updateOrder',
        description: 'Update an existing order',
        action: 'Update order',
      },
    ],
    default: 'getOrders',
  },
];

export const orderFields: INodeProperties[] = [
  {
    displayName: 'Account Address',
    name: 'accountAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['getOrders'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The account address to query orders for',
  },
  {
    displayName: 'Order Key',
    name: 'orderKey',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['getOrder', 'cancelOrder', 'updateOrder'],
      },
    },
    default: '',
    description: 'The unique key identifying the order',
  },
  {
    displayName: 'Market Address',
    name: 'marketAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['createMarketOrder', 'createLimitOrder', 'createStopLoss', 'createTakeProfit'],
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
        resource: ['order'],
        operation: ['createMarketOrder', 'createLimitOrder', 'createStopLoss', 'createTakeProfit'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The collateral token address',
  },
  {
    displayName: 'Order Direction',
    name: 'orderDirection',
    type: 'options',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['createMarketOrder', 'createLimitOrder'],
      },
    },
    options: [
      { name: 'Long (Buy)', value: 'long' },
      { name: 'Short (Sell)', value: 'short' },
    ],
    default: 'long',
    description: 'Whether to open a long or short position',
  },
  {
    displayName: 'Is Long',
    name: 'isLong',
    type: 'boolean',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['createStopLoss', 'createTakeProfit'],
      },
    },
    default: true,
    description: 'Whether the position is long',
  },
  {
    displayName: 'Size (USD)',
    name: 'sizeUsd',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['createMarketOrder', 'createLimitOrder', 'createStopLoss', 'createTakeProfit', 'updateOrder'],
      },
    },
    default: 0,
    description: 'The position size in USD',
  },
  {
    displayName: 'Collateral Amount',
    name: 'collateralAmount',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['createMarketOrder', 'createLimitOrder'],
      },
    },
    default: '0',
    description: 'The amount of collateral (in token units)',
  },
  {
    displayName: 'Trigger Price',
    name: 'triggerPrice',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['createLimitOrder', 'createStopLoss', 'createTakeProfit', 'updateOrder'],
      },
    },
    default: '0',
    description: 'The price at which to trigger the order',
  },
  {
    displayName: 'Slippage (%)',
    name: 'slippagePercent',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['createMarketOrder', 'createLimitOrder', 'createStopLoss', 'createTakeProfit'],
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
        resource: ['order'],
        operation: ['createMarketOrder', 'createLimitOrder', 'createStopLoss', 'createTakeProfit'],
      },
    },
    default: '0.001',
    description: 'Execution fee in ETH for keeper execution',
  },
];

export async function executeOrderOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('gmxNetwork');
  const protocolVersion = credentials.protocolVersion as string;

  if (protocolVersion !== 'v2') {
    throw new NodeOperationError(
      this.getNode(),
      'Order operations are optimized for GMX V2. Use V1 position router for V1 orders.',
    );
  }

  let result: Record<string, unknown> = {};

  try {
    const v2Client = await createGmxV2Client(this);
    const { ethers } = require('ethers');

    switch (operation) {
      case 'getOrders': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const orders = await v2Client.getAccountOrders(accountAddress);

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
        break;
      }

      case 'getOrder': {
        const orderKey = this.getNodeParameter('orderKey', index) as string;
        const order = await v2Client.getOrder(orderKey);

        result = {
          key: order.key,
          account: order.account,
          market: order.market,
          initialCollateralToken: order.initialCollateralToken,
          orderType: order.orderType,
          isLong: order.isLong,
          sizeDeltaUsd: (Number(order.sizeDeltaUsd) / Number(PRECISION)).toFixed(2),
          triggerPrice: order.triggerPrice.toString(),
          acceptablePrice: order.acceptablePrice.toString(),
          executionFee: order.executionFee.toString(),
          isFrozen: order.isFrozen,
        };
        break;
      }

      case 'createMarketOrder': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const collateralToken = this.getNodeParameter('collateralToken', index) as string;
        const orderDirection = this.getNodeParameter('orderDirection', index) as string;
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const collateralAmount = this.getNodeParameter('collateralAmount', index) as string;
        const slippagePercent = this.getNodeParameter('slippagePercent', index) as number;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        const isLong = orderDirection === 'long';
        const signerAddress = v2Client.getSignerAddress();

        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for creating orders');
        }

        // Get current price for acceptable price
        const market = await v2Client.getMarket(marketAddress);
        const price = await v2Client.getOraclePrice(market.indexToken);
        const currentPrice = isLong ? price.max : price.min;

        const slippageBps = Math.floor(slippagePercent * 100);
        const acceptablePrice = isLong
          ? currentPrice + (currentPrice * BigInt(slippageBps)) / BigInt(10000)
          : currentPrice - (currentPrice * BigInt(slippageBps)) / BigInt(10000);

        const txHash = await v2Client.createOrder({
          receiver: signerAddress,
          callbackContract: ethers.ZeroAddress,
          uiFeeReceiver: ethers.ZeroAddress,
          market: marketAddress,
          initialCollateralToken: collateralToken,
          swapPath: [],
          sizeDeltaUsd: BigInt(Math.floor(sizeUsd * 10 ** 30)),
          initialCollateralDeltaAmount: BigInt(collateralAmount),
          triggerPrice: BigInt(0),
          acceptablePrice,
          executionFee: ethers.parseEther(executionFee),
          callbackGasLimit: BigInt(0),
          minOutputAmount: BigInt(0),
          orderType: OrderType.MarketIncrease,
          decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
          isLong,
          shouldUnwrapNativeToken: false,
          referralCode: ethers.ZeroHash,
          autoCancel: false,
        });

        result = {
          success: true,
          txHash,
          orderType: 'MarketIncrease',
          market: marketAddress,
          sizeUsd,
          isLong,
        };
        break;
      }

      case 'createLimitOrder': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const collateralToken = this.getNodeParameter('collateralToken', index) as string;
        const orderDirection = this.getNodeParameter('orderDirection', index) as string;
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const collateralAmount = this.getNodeParameter('collateralAmount', index) as string;
        const triggerPrice = this.getNodeParameter('triggerPrice', index) as string;
        const slippagePercent = this.getNodeParameter('slippagePercent', index) as number;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        const isLong = orderDirection === 'long';
        const signerAddress = v2Client.getSignerAddress();

        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for creating orders');
        }

        const triggerPriceBigInt = BigInt(triggerPrice);
        const slippageBps = Math.floor(slippagePercent * 100);
        const acceptablePrice = isLong
          ? triggerPriceBigInt + (triggerPriceBigInt * BigInt(slippageBps)) / BigInt(10000)
          : triggerPriceBigInt - (triggerPriceBigInt * BigInt(slippageBps)) / BigInt(10000);

        const txHash = await v2Client.createOrder({
          receiver: signerAddress,
          callbackContract: ethers.ZeroAddress,
          uiFeeReceiver: ethers.ZeroAddress,
          market: marketAddress,
          initialCollateralToken: collateralToken,
          swapPath: [],
          sizeDeltaUsd: BigInt(Math.floor(sizeUsd * 10 ** 30)),
          initialCollateralDeltaAmount: BigInt(collateralAmount),
          triggerPrice: triggerPriceBigInt,
          acceptablePrice,
          executionFee: ethers.parseEther(executionFee),
          callbackGasLimit: BigInt(0),
          minOutputAmount: BigInt(0),
          orderType: OrderType.LimitIncrease,
          decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
          isLong,
          shouldUnwrapNativeToken: false,
          referralCode: ethers.ZeroHash,
          autoCancel: false,
        });

        result = {
          success: true,
          txHash,
          orderType: 'LimitIncrease',
          market: marketAddress,
          sizeUsd,
          triggerPrice,
          isLong,
        };
        break;
      }

      case 'createStopLoss': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const collateralToken = this.getNodeParameter('collateralToken', index) as string;
        const isLong = this.getNodeParameter('isLong', index) as boolean;
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const triggerPrice = this.getNodeParameter('triggerPrice', index) as string;
        const slippagePercent = this.getNodeParameter('slippagePercent', index) as number;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        const signerAddress = v2Client.getSignerAddress();

        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for creating orders');
        }

        const triggerPriceBigInt = BigInt(triggerPrice);
        const slippageBps = Math.floor(slippagePercent * 100);
        // Stop-loss sells at worse price
        const acceptablePrice = isLong
          ? triggerPriceBigInt - (triggerPriceBigInt * BigInt(slippageBps)) / BigInt(10000)
          : triggerPriceBigInt + (triggerPriceBigInt * BigInt(slippageBps)) / BigInt(10000);

        const txHash = await v2Client.createOrder({
          receiver: signerAddress,
          callbackContract: ethers.ZeroAddress,
          uiFeeReceiver: ethers.ZeroAddress,
          market: marketAddress,
          initialCollateralToken: collateralToken,
          swapPath: [],
          sizeDeltaUsd: BigInt(Math.floor(sizeUsd * 10 ** 30)),
          initialCollateralDeltaAmount: BigInt(0),
          triggerPrice: triggerPriceBigInt,
          acceptablePrice,
          executionFee: ethers.parseEther(executionFee),
          callbackGasLimit: BigInt(0),
          minOutputAmount: BigInt(0),
          orderType: OrderType.StopLossDecrease,
          decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
          isLong,
          shouldUnwrapNativeToken: false,
          referralCode: ethers.ZeroHash,
          autoCancel: false,
        });

        result = {
          success: true,
          txHash,
          orderType: 'StopLossDecrease',
          market: marketAddress,
          sizeUsd,
          triggerPrice,
          isLong,
        };
        break;
      }

      case 'createTakeProfit': {
        const marketAddress = this.getNodeParameter('marketAddress', index) as string;
        const collateralToken = this.getNodeParameter('collateralToken', index) as string;
        const isLong = this.getNodeParameter('isLong', index) as boolean;
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const triggerPrice = this.getNodeParameter('triggerPrice', index) as string;
        const slippagePercent = this.getNodeParameter('slippagePercent', index) as number;
        const executionFee = this.getNodeParameter('executionFee', index) as string;

        const signerAddress = v2Client.getSignerAddress();

        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for creating orders');
        }

        const triggerPriceBigInt = BigInt(triggerPrice);
        const slippageBps = Math.floor(slippagePercent * 100);
        // Take-profit at favorable price
        const acceptablePrice = isLong
          ? triggerPriceBigInt - (triggerPriceBigInt * BigInt(slippageBps)) / BigInt(10000)
          : triggerPriceBigInt + (triggerPriceBigInt * BigInt(slippageBps)) / BigInt(10000);

        const txHash = await v2Client.createOrder({
          receiver: signerAddress,
          callbackContract: ethers.ZeroAddress,
          uiFeeReceiver: ethers.ZeroAddress,
          market: marketAddress,
          initialCollateralToken: collateralToken,
          swapPath: [],
          sizeDeltaUsd: BigInt(Math.floor(sizeUsd * 10 ** 30)),
          initialCollateralDeltaAmount: BigInt(0),
          triggerPrice: triggerPriceBigInt,
          acceptablePrice,
          executionFee: ethers.parseEther(executionFee),
          callbackGasLimit: BigInt(0),
          minOutputAmount: BigInt(0),
          orderType: OrderType.LimitDecrease,
          decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
          isLong,
          shouldUnwrapNativeToken: false,
          referralCode: ethers.ZeroHash,
          autoCancel: false,
        });

        result = {
          success: true,
          txHash,
          orderType: 'TakeProfitDecrease',
          market: marketAddress,
          sizeUsd,
          triggerPrice,
          isLong,
        };
        break;
      }

      case 'cancelOrder': {
        const orderKey = this.getNodeParameter('orderKey', index) as string;

        const signerAddress = v2Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for canceling orders');
        }

        const txHash = await v2Client.cancelOrder(orderKey);

        result = {
          success: true,
          txHash,
          operation: 'cancelOrder',
          orderKey,
        };
        break;
      }

      case 'updateOrder': {
        const orderKey = this.getNodeParameter('orderKey', index) as string;
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const triggerPrice = this.getNodeParameter('triggerPrice', index) as string;

        const signerAddress = v2Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for updating orders');
        }

        const txHash = await v2Client.updateOrder(
          orderKey,
          BigInt(Math.floor(sizeUsd * 10 ** 30)),
          BigInt(0), // acceptablePrice
          BigInt(triggerPrice),
          BigInt(0), // minOutputAmount
          false, // autoCancel
        );

        result = {
          success: true,
          txHash,
          operation: 'updateOrder',
          orderKey,
          newSizeUsd: sizeUsd,
          newTriggerPrice: triggerPrice,
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
