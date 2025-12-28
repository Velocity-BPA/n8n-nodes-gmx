/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV1Client, createGmxV2Client } from '../../transport';
import { calculateLeverage, getLeverageInfo } from '../../utils/leverageUtils';
import { calculateLiquidationPrice } from '../../utils/positionUtils';
import { PRECISION, NETWORKS, CONTRACTS } from '../../constants';

export const utilityOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['utility'],
      },
    },
    options: [
      {
        name: 'Calculate Position Size',
        value: 'calculatePositionSize',
        description: 'Calculate position size from collateral and leverage',
        action: 'Calculate position size',
      },
      {
        name: 'Calculate Leverage',
        value: 'calculateLeverage',
        description: 'Calculate leverage from size and collateral',
        action: 'Calculate leverage',
      },
      {
        name: 'Calculate Liquidation Price',
        value: 'calculateLiquidationPrice',
        description: 'Calculate liquidation price for a position',
        action: 'Calculate liquidation price',
      },
      {
        name: 'Get Contract Addresses',
        value: 'getContractAddresses',
        description: 'Get contract addresses for a network',
        action: 'Get contract addresses',
      },
      {
        name: 'Validate Position',
        value: 'validatePosition',
        description: 'Validate position parameters',
        action: 'Validate position',
      },
      {
        name: 'Get Network Info',
        value: 'getNetworkInfo',
        description: 'Get network configuration information',
        action: 'Get network info',
      },
    ],
    default: 'calculateLeverage',
  },
];

export const utilityFields: INodeProperties[] = [
  {
    displayName: 'Size (USD)',
    name: 'sizeUsd',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['utility'],
        operation: ['calculateLeverage', 'calculateLiquidationPrice', 'validatePosition'],
      },
    },
    default: 0,
    description: 'Position size in USD',
  },
  {
    displayName: 'Collateral (USD)',
    name: 'collateralUsd',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['utility'],
        operation: ['calculateLeverage', 'calculatePositionSize', 'calculateLiquidationPrice', 'validatePosition'],
      },
    },
    default: 0,
    description: 'Collateral amount in USD',
  },
  {
    displayName: 'Leverage',
    name: 'leverage',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['utility'],
        operation: ['calculatePositionSize'],
      },
    },
    default: 1,
    description: 'Desired leverage multiplier',
  },
  {
    displayName: 'Entry Price',
    name: 'entryPrice',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['utility'],
        operation: ['calculateLiquidationPrice'],
      },
    },
    default: 0,
    description: 'Position entry price',
  },
  {
    displayName: 'Is Long',
    name: 'isLong',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['utility'],
        operation: ['calculateLiquidationPrice'],
      },
    },
    default: true,
    description: 'Whether the position is long',
  },
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['utility'],
        operation: ['getContractAddresses', 'getNetworkInfo'],
      },
    },
    options: [
      { name: 'Arbitrum One', value: 'arbitrum' },
      { name: 'Avalanche', value: 'avalanche' },
      { name: 'Arbitrum Sepolia (Testnet)', value: 'arbitrumSepolia' },
    ],
    default: 'arbitrum',
    description: 'The network to get information for',
  },
  {
    displayName: 'Max Leverage',
    name: 'maxLeverage',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['utility'],
        operation: ['validatePosition'],
      },
    },
    default: 100,
    description: 'Maximum allowed leverage',
  },
];

export async function executeUtilityOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;

  let result: Record<string, unknown> = {};

  try {
    switch (operation) {
      case 'calculatePositionSize': {
        const collateralUsd = this.getNodeParameter('collateralUsd', index) as number;
        const leverage = this.getNodeParameter('leverage', index) as number;

        const positionSize = collateralUsd * leverage;

        result = {
          collateralUsd,
          leverage,
          positionSizeUsd: positionSize,
          formatted: {
            collateral: `$${collateralUsd.toLocaleString()}`,
            leverage: `${leverage}x`,
            positionSize: `$${positionSize.toLocaleString()}`,
          },
        };
        break;
      }

      case 'calculateLeverage': {
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const collateralUsd = this.getNodeParameter('collateralUsd', index) as number;

        const sizeBigInt = BigInt(Math.floor(sizeUsd * 10 ** 30));
        const collateralBigInt = BigInt(Math.floor(collateralUsd * 10 ** 30));

        const leverageInfo = getLeverageInfo({ size: sizeBigInt, collateral: collateralBigInt });

        result = {
          sizeUsd,
          collateralUsd,
          leverage: leverageInfo.leverage,
          leverageFormatted: leverageInfo.leverageFormatted,
          isValid: leverageInfo.isValid,
          maxSizeUsd: (Number(leverageInfo.maxSize) / Number(PRECISION)).toFixed(2),
          minCollateralUsd: (Number(leverageInfo.minCollateral) / Number(PRECISION)).toFixed(2),
        };
        break;
      }

      case 'calculateLiquidationPrice': {
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const collateralUsd = this.getNodeParameter('collateralUsd', index) as number;
        const entryPrice = this.getNodeParameter('entryPrice', index) as number;
        const isLong = this.getNodeParameter('isLong', index) as boolean;

        const sizeBigInt = BigInt(Math.floor(sizeUsd * 10 ** 30));
        const collateralBigInt = BigInt(Math.floor(collateralUsd * 10 ** 30));
        const entryPriceBigInt = BigInt(Math.floor(entryPrice * 10 ** 30));

        const liqResult = calculateLiquidationPrice({
          size: sizeBigInt,
          collateral: collateralBigInt,
          averagePrice: entryPriceBigInt,
          isLong,
          fundingFee: BigInt(0),
          marginFeeBasisPoints: 10, // 0.1%
        });

        result = {
          sizeUsd,
          collateralUsd,
          entryPrice,
          isLong,
          liquidationPrice: (Number(liqResult.liquidationPrice) / Number(PRECISION)).toFixed(2),
          liquidationRisk: liqResult.liquidationRisk,
          isLiquidatable: liqResult.isLiquidatable,
          priceDistancePercent: entryPrice > 0
            ? (Math.abs(Number(liqResult.liquidationPrice) / Number(PRECISION) - entryPrice) / entryPrice * 100).toFixed(2)
            : '0',
        };
        break;
      }

      case 'getContractAddresses': {
        const network = this.getNodeParameter('network', index) as string;
        const addresses = CONTRACTS[network] || {};

        result = {
          network,
          contracts: addresses,
        };
        break;
      }

      case 'validatePosition': {
        const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
        const collateralUsd = this.getNodeParameter('collateralUsd', index) as number;
        const maxLeverage = this.getNodeParameter('maxLeverage', index) as number;

        const leverage = collateralUsd > 0 ? sizeUsd / collateralUsd : 0;
        const errors: string[] = [];

        if (sizeUsd <= 0) {
          errors.push('Size must be greater than 0');
        }
        if (collateralUsd <= 0) {
          errors.push('Collateral must be greater than 0');
        }
        if (leverage > maxLeverage) {
          errors.push(`Leverage ${leverage.toFixed(2)}x exceeds maximum ${maxLeverage}x`);
        }
        if (collateralUsd < 10) {
          errors.push('Minimum collateral is $10');
        }

        result = {
          valid: errors.length === 0,
          errors,
          position: {
            sizeUsd,
            collateralUsd,
            leverage: leverage.toFixed(2),
          },
        };
        break;
      }

      case 'getNetworkInfo': {
        const network = this.getNodeParameter('network', index) as string;
        const networkConfig = NETWORKS[network];

        if (!networkConfig) {
          throw new NodeOperationError(this.getNode(), `Unknown network: ${network}`);
        }

        result = {
          network,
          ...networkConfig,
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
