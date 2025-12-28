/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
  accountOperations,
  accountFields,
  executeAccountOperations,
  positionOperations,
  positionFields,
  executePositionOperations,
  marketOperations,
  marketFields,
  executeMarketOperations,
  orderOperations,
  orderFields,
  executeOrderOperations,
  glpOperations,
  glpFields,
  executeGlpOperations,
  gmOperations,
  gmFields,
  executeGmOperations,
  stakingOperations,
  stakingFields,
  executeStakingOperations,
  analyticsOperations,
  analyticsFields,
  executeAnalyticsOperations,
  utilityOperations,
  utilityFields,
  executeUtilityOperations,
} from './actions';

// Emit licensing notice once on node load
const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]
This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

let licenseNoticeEmitted = false;
if (!licenseNoticeEmitted) {
  console.warn(LICENSING_NOTICE);
  licenseNoticeEmitted = true;
}

export class Gmx implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GMX',
    name: 'gmx',
    icon: 'file:gmx.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Interact with GMX decentralized perpetuals exchange for trading, liquidity provision, and staking',
    defaults: {
      name: 'GMX',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'gmxNetwork',
        required: true,
      },
      {
        name: 'gmxApi',
        required: false,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Account',
            value: 'account',
            description: 'Account overview, positions, orders, and stats',
          },
          {
            name: 'Position',
            value: 'position',
            description: 'Manage perpetual positions (open, close, modify)',
          },
          {
            name: 'Order',
            value: 'order',
            description: 'Create and manage orders (market, limit, stop-loss, take-profit)',
          },
          {
            name: 'Market',
            value: 'market',
            description: 'Market data, prices, funding rates, and liquidity',
          },
          {
            name: 'GLP (V1)',
            value: 'glp',
            description: 'GLP liquidity token operations (mint, redeem, stats)',
          },
          {
            name: 'GM (V2)',
            value: 'gm',
            description: 'GM liquidity pool operations (deposit, withdraw)',
          },
          {
            name: 'Staking',
            value: 'staking',
            description: 'GMX staking and rewards',
          },
          {
            name: 'Analytics',
            value: 'analytics',
            description: 'Protocol analytics and statistics',
          },
          {
            name: 'Utility',
            value: 'utility',
            description: 'Helper functions for calculations and validation',
          },
        ],
        default: 'account',
      },
      // Account operations and fields
      ...accountOperations,
      ...accountFields,
      // Position operations and fields
      ...positionOperations,
      ...positionFields,
      // Order operations and fields
      ...orderOperations,
      ...orderFields,
      // Market operations and fields
      ...marketOperations,
      ...marketFields,
      // GLP operations and fields
      ...glpOperations,
      ...glpFields,
      // GM operations and fields
      ...gmOperations,
      ...gmFields,
      // Staking operations and fields
      ...stakingOperations,
      ...stakingFields,
      // Analytics operations and fields
      ...analyticsOperations,
      ...analyticsFields,
      // Utility operations and fields
      ...utilityOperations,
      ...utilityFields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        let result: INodeExecutionData[];

        switch (resource) {
          case 'account':
            result = await executeAccountOperations.call(this, i);
            break;
          case 'position':
            result = await executePositionOperations.call(this, i);
            break;
          case 'order':
            result = await executeOrderOperations.call(this, i);
            break;
          case 'market':
            result = await executeMarketOperations.call(this, i);
            break;
          case 'glp':
            result = await executeGlpOperations.call(this, i);
            break;
          case 'gm':
            result = await executeGmOperations.call(this, i);
            break;
          case 'staking':
            result = await executeStakingOperations.call(this, i);
            break;
          case 'analytics':
            result = await executeAnalyticsOperations.call(this, i);
            break;
          case 'utility':
            result = await executeUtilityOperations.call(this, i);
            break;
          default:
            throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
