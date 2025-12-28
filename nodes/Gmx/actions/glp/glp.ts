/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV1Client, createSubgraphClient } from '../../transport';
import { PRECISION } from '../../constants';

export const glpOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['glp'],
      },
    },
    options: [
      {
        name: 'Get GLP Price',
        value: 'getGlpPrice',
        description: 'Get current GLP token price',
        action: 'Get glp price',
      },
      {
        name: 'Get GLP Stats',
        value: 'getGlpStats',
        description: 'Get GLP statistics including supply and AUM',
        action: 'Get glp stats',
      },
      {
        name: 'Get GLP Composition',
        value: 'getGlpComposition',
        description: 'Get GLP pool composition by token',
        action: 'Get glp composition',
      },
      {
        name: 'Get GLP Balance',
        value: 'getGlpBalance',
        description: 'Get GLP balance for an account',
        action: 'Get glp balance',
      },
      {
        name: 'Mint GLP',
        value: 'mintGlp',
        description: 'Mint GLP by depositing tokens',
        action: 'Mint glp',
      },
      {
        name: 'Redeem GLP',
        value: 'redeemGlp',
        description: 'Redeem GLP for underlying tokens',
        action: 'Redeem glp',
      },
      {
        name: 'Get Mint/Redeem Fees',
        value: 'getMintRedeemFees',
        description: 'Get estimated fees for minting or redeeming GLP',
        action: 'Get mint redeem fees',
      },
    ],
    default: 'getGlpPrice',
  },
];

export const glpFields: INodeProperties[] = [
  {
    displayName: 'Account Address',
    name: 'accountAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['glp'],
        operation: ['getGlpBalance'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The account address to query GLP balance for',
  },
  {
    displayName: 'Token Address',
    name: 'tokenAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['glp'],
        operation: ['mintGlp', 'redeemGlp', 'getMintRedeemFees'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The token address to use for mint/redeem',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['glp'],
        operation: ['mintGlp', 'redeemGlp'],
      },
    },
    default: '0',
    description: 'Amount of tokens to mint with or GLP to redeem',
  },
  {
    displayName: 'Min Output',
    name: 'minOutput',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['glp'],
        operation: ['mintGlp', 'redeemGlp'],
      },
    },
    default: '0',
    description: 'Minimum output amount (for slippage protection)',
  },
];

export async function executeGlpOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const credentials = await this.getCredentials('gmxNetwork');
  const protocolVersion = credentials.protocolVersion as string;

  if (protocolVersion !== 'v1') {
    throw new NodeOperationError(
      this.getNode(),
      'GLP operations are only available for GMX V1. For V2, use GM operations.',
    );
  }

  let result: Record<string, unknown> = {};

  try {
    const v1Client = await createGmxV1Client(this);

    switch (operation) {
      case 'getGlpPrice': {
        const [minPrice, maxPrice] = await Promise.all([
          v1Client.getGlpPrice(false),
          v1Client.getGlpPrice(true),
        ]);

        result = {
          price: {
            min: (Number(minPrice) / Number(PRECISION)).toFixed(4),
            max: (Number(maxPrice) / Number(PRECISION)).toFixed(4),
            mid: (Number((minPrice + maxPrice) / BigInt(2)) / Number(PRECISION)).toFixed(4),
          },
          raw: {
            min: minPrice.toString(),
            max: maxPrice.toString(),
          },
        };
        break;
      }

      case 'getGlpStats': {
        const glpInfo = await v1Client.getGlpInfo();
        const subgraphClient = await createSubgraphClient(this);
        const glpStats = await subgraphClient.getGlpStats();

        result = {
          price: (Number(glpInfo.price) / Number(PRECISION)).toFixed(4),
          supply: glpInfo.supply.toString(),
          aum: (Number(glpInfo.aum) / Number(PRECISION)).toFixed(2),
          aumInUsdg: (Number(glpInfo.aumInUsdg) / Number(PRECISION)).toFixed(2),
          subgraphStats: glpStats,
        };
        break;
      }

      case 'getGlpComposition': {
        // This would require querying vault for each token
        result = {
          message: 'GLP composition requires querying individual token weights from vault',
          note: 'Use market.getAvailableLiquidity for individual token info',
        };
        break;
      }

      case 'getGlpBalance': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const { getContractAddresses } = await import('../../constants/contracts');
        const addresses = getContractAddresses(credentials.network as string);

        if (!addresses.glp) {
          throw new NodeOperationError(this.getNode(), 'GLP address not found for network');
        }

        const balance = await v1Client.getTokenBalance(addresses.glp, accountAddress);

        result = {
          account: accountAddress,
          glpBalance: balance.toString(),
          glpBalanceFormatted: (Number(balance) / 10 ** 18).toFixed(4),
        };
        break;
      }

      case 'mintGlp': {
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const amount = this.getNodeParameter('amount', index) as string;
        const minOutput = this.getNodeParameter('minOutput', index) as string;

        const signerAddress = v1Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for minting GLP');
        }

        const txHash = await v1Client.mintAndStakeGlp(
          tokenAddress,
          BigInt(amount),
          BigInt(0), // minUsdg
          BigInt(minOutput),
        );

        result = {
          success: true,
          txHash,
          operation: 'mintGlp',
          tokenIn: tokenAddress,
          amountIn: amount,
        };
        break;
      }

      case 'redeemGlp': {
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const amount = this.getNodeParameter('amount', index) as string;
        const minOutput = this.getNodeParameter('minOutput', index) as string;

        const signerAddress = v1Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for redeeming GLP');
        }

        const txHash = await v1Client.unstakeAndRedeemGlp(
          tokenAddress,
          BigInt(amount),
          BigInt(minOutput),
          signerAddress,
        );

        result = {
          success: true,
          txHash,
          operation: 'redeemGlp',
          tokenOut: tokenAddress,
          glpAmount: amount,
        };
        break;
      }

      case 'getMintRedeemFees': {
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

        // Fees are dynamic based on token weight deviation
        result = {
          token: tokenAddress,
          note: 'Mint/redeem fees are dynamic and depend on current vs target weights',
          baseMintBurnFeeBps: 25, // 0.25% base fee
          message: 'Use vault contract to calculate exact fees based on current state',
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
