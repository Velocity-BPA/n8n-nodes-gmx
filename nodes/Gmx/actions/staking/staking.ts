/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createGmxV1Client } from '../../transport';

export const stakingOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['staking'],
      },
    },
    options: [
      {
        name: 'Get Staking Info',
        value: 'getStakingInfo',
        description: 'Get staking information for an account',
        action: 'Get staking info',
      },
      {
        name: 'Stake GMX',
        value: 'stakeGmx',
        description: 'Stake GMX tokens',
        action: 'Stake gmx',
      },
      {
        name: 'Unstake GMX',
        value: 'unstakeGmx',
        description: 'Unstake GMX tokens',
        action: 'Unstake gmx',
      },
      {
        name: 'Claim Rewards',
        value: 'claimRewards',
        description: 'Claim staking rewards (ETH/AVAX + esGMX)',
        action: 'Claim rewards',
      },
      {
        name: 'Compound Rewards',
        value: 'compoundRewards',
        description: 'Compound esGMX and multiplier points',
        action: 'Compound rewards',
      },
      {
        name: 'Get Claimable Rewards',
        value: 'getClaimableRewards',
        description: 'Get claimable reward amounts',
        action: 'Get claimable rewards',
      },
    ],
    default: 'getStakingInfo',
  },
];

export const stakingFields: INodeProperties[] = [
  {
    displayName: 'Account Address',
    name: 'accountAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['staking'],
        operation: ['getStakingInfo', 'getClaimableRewards'],
      },
    },
    default: '',
    placeholder: '0x...',
    description: 'The account address to query staking info for',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['staking'],
        operation: ['stakeGmx', 'unstakeGmx'],
      },
    },
    default: '0',
    description: 'Amount of GMX to stake/unstake (in wei)',
  },
];

export async function executeStakingOperations(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;

  let result: Record<string, unknown> = {};

  try {
    const v1Client = await createGmxV1Client(this);

    switch (operation) {
      case 'getStakingInfo': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const stakingInfo = await v1Client.getStakingInfo(accountAddress);

        result = {
          account: accountAddress,
          stakedGmx: stakingInfo.stakedGmx.toString(),
          stakedGmxFormatted: (Number(stakingInfo.stakedGmx) / 10 ** 18).toFixed(4),
          esGmxBalance: stakingInfo.esGmxBalance.toString(),
          esGmxBalanceFormatted: (Number(stakingInfo.esGmxBalance) / 10 ** 18).toFixed(4),
          claimableEth: stakingInfo.claimableEth.toString(),
          claimableEthFormatted: (Number(stakingInfo.claimableEth) / 10 ** 18).toFixed(6),
          claimableEsGmx: stakingInfo.claimableEsGmx.toString(),
          claimableEsGmxFormatted: (Number(stakingInfo.claimableEsGmx) / 10 ** 18).toFixed(4),
        };
        break;
      }

      case 'stakeGmx': {
        const amount = this.getNodeParameter('amount', index) as string;

        const signerAddress = v1Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for staking');
        }

        const txHash = await v1Client.stakeGmx(BigInt(amount));

        result = {
          success: true,
          txHash,
          operation: 'stakeGmx',
          amount,
          amountFormatted: (Number(amount) / 10 ** 18).toFixed(4),
        };
        break;
      }

      case 'unstakeGmx': {
        const amount = this.getNodeParameter('amount', index) as string;

        const signerAddress = v1Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for unstaking');
        }

        const txHash = await v1Client.unstakeGmx(BigInt(amount));

        result = {
          success: true,
          txHash,
          operation: 'unstakeGmx',
          amount,
          amountFormatted: (Number(amount) / 10 ** 18).toFixed(4),
        };
        break;
      }

      case 'claimRewards': {
        const signerAddress = v1Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for claiming rewards');
        }

        const txHash = await v1Client.claimRewards();

        result = {
          success: true,
          txHash,
          operation: 'claimRewards',
        };
        break;
      }

      case 'compoundRewards': {
        const signerAddress = v1Client.getSignerAddress();
        if (!signerAddress) {
          throw new NodeOperationError(this.getNode(), 'Private key required for compounding');
        }

        const txHash = await v1Client.compoundRewards();

        result = {
          success: true,
          txHash,
          operation: 'compoundRewards',
        };
        break;
      }

      case 'getClaimableRewards': {
        const accountAddress = this.getNodeParameter('accountAddress', index) as string;
        const stakingInfo = await v1Client.getStakingInfo(accountAddress);

        result = {
          account: accountAddress,
          claimableEth: stakingInfo.claimableEth.toString(),
          claimableEthFormatted: (Number(stakingInfo.claimableEth) / 10 ** 18).toFixed(6),
          claimableEsGmx: stakingInfo.claimableEsGmx.toString(),
          claimableEsGmxFormatted: (Number(stakingInfo.claimableEsGmx) / 10 ** 18).toFixed(4),
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
