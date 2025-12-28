/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  ITriggerFunctions,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
} from 'n8n-workflow';
import { createGmxV2Client, createSubgraphClient } from './transport';
import { PRECISION } from './constants';

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

export class GmxTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GMX Trigger',
    name: 'gmxTrigger',
    icon: 'file:gmx.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["triggerType"]}}',
    description: 'Trigger workflows on GMX events like position changes, orders, and price alerts',
    defaults: {
      name: 'GMX Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'gmxNetwork',
        required: true,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Trigger Type',
        name: 'triggerType',
        type: 'options',
        options: [
          {
            name: 'Position Changed',
            value: 'positionChanged',
            description: 'Trigger when a position is opened, closed, or modified',
          },
          {
            name: 'Order Executed',
            value: 'orderExecuted',
            description: 'Trigger when an order is executed',
          },
          {
            name: 'Price Alert',
            value: 'priceAlert',
            description: 'Trigger when price crosses a threshold',
          },
          {
            name: 'Liquidation Alert',
            value: 'liquidationAlert',
            description: 'Trigger when a position is at risk of liquidation',
          },
          {
            name: 'New Trade',
            value: 'newTrade',
            description: 'Trigger on new trades for an account',
          },
          {
            name: 'Funding Rate Changed',
            value: 'fundingRateChanged',
            description: 'Trigger when funding rate changes significantly',
          },
        ],
        default: 'positionChanged',
        description: 'The type of event to trigger on',
      },
      {
        displayName: 'Account Address',
        name: 'accountAddress',
        type: 'string',
        displayOptions: {
          show: {
            triggerType: ['positionChanged', 'orderExecuted', 'liquidationAlert', 'newTrade'],
          },
        },
        default: '',
        placeholder: '0x...',
        description: 'The account address to monitor',
      },
      {
        displayName: 'Market Address',
        name: 'marketAddress',
        type: 'string',
        displayOptions: {
          show: {
            triggerType: ['priceAlert', 'fundingRateChanged'],
          },
        },
        default: '',
        placeholder: '0x...',
        description: 'The market address to monitor',
      },
      {
        displayName: 'Token Address',
        name: 'tokenAddress',
        type: 'string',
        displayOptions: {
          show: {
            triggerType: ['priceAlert'],
          },
        },
        default: '',
        placeholder: '0x...',
        description: 'The token address for price monitoring',
      },
      {
        displayName: 'Price Threshold',
        name: 'priceThreshold',
        type: 'number',
        displayOptions: {
          show: {
            triggerType: ['priceAlert'],
          },
        },
        default: 0,
        description: 'The price threshold to trigger on',
      },
      {
        displayName: 'Trigger Direction',
        name: 'triggerDirection',
        type: 'options',
        displayOptions: {
          show: {
            triggerType: ['priceAlert'],
          },
        },
        options: [
          { name: 'Above', value: 'above' },
          { name: 'Below', value: 'below' },
          { name: 'Cross (Either)', value: 'cross' },
        ],
        default: 'above',
        description: 'Trigger when price goes above or below threshold',
      },
      {
        displayName: 'Liquidation Risk Threshold (%)',
        name: 'liquidationRiskThreshold',
        type: 'number',
        displayOptions: {
          show: {
            triggerType: ['liquidationAlert'],
          },
        },
        default: 80,
        description: 'Trigger when liquidation risk exceeds this percentage',
      },
      {
        displayName: 'Funding Rate Change Threshold (%)',
        name: 'fundingRateChangeThreshold',
        type: 'number',
        displayOptions: {
          show: {
            triggerType: ['fundingRateChanged'],
          },
        },
        default: 0.1,
        description: 'Trigger when funding rate changes by this percentage',
      },
    ],
  };

  async poll(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const triggerType = this.getNodeParameter('triggerType') as string;
    const webhookData = this.getWorkflowStaticData('node');
    const credentials = await this.getCredentials('gmxNetwork');
    const protocolVersion = credentials.protocolVersion as string;

    const returnData: any[] = [];

    try {
      switch (triggerType) {
        case 'positionChanged': {
          const accountAddress = this.getNodeParameter('accountAddress') as string;

          if (protocolVersion === 'v2') {
            const v2Client = await createGmxV2Client(this as any);
            const positions = await v2Client.getAccountPositions(accountAddress);

            const positionsKey = positions
              .map((p) => `${p.market}-${p.isLong}-${p.sizeInUsd}`)
              .join('|');
            const lastPositionsKey = webhookData.lastPositionsKey as string | undefined;

            if (lastPositionsKey !== positionsKey) {
              webhookData.lastPositionsKey = positionsKey;

              if (lastPositionsKey !== undefined) {
                returnData.push({
                  json: {
                    triggerType: 'positionChanged',
                    account: accountAddress,
                    positions: positions.map((p) => ({
                      market: p.market,
                      isLong: p.isLong,
                      sizeInUsd: (Number(p.sizeInUsd) / Number(PRECISION)).toFixed(2),
                      collateralAmount: p.collateralAmount.toString(),
                    })),
                    timestamp: new Date().toISOString(),
                  },
                });
              }
            }
          }
          break;
        }

        case 'orderExecuted': {
          const accountAddress = this.getNodeParameter('accountAddress') as string;

          if (protocolVersion === 'v2') {
            const v2Client = await createGmxV2Client(this as any);
            const orders = await v2Client.getAccountOrders(accountAddress);

            const ordersCount = orders.length;
            const lastOrdersCount = webhookData.lastOrdersCount as number | undefined;

            if (lastOrdersCount !== undefined && ordersCount < lastOrdersCount) {
              returnData.push({
                json: {
                  triggerType: 'orderExecuted',
                  account: accountAddress,
                  currentOrders: ordersCount,
                  previousOrders: lastOrdersCount,
                  ordersExecuted: lastOrdersCount - ordersCount,
                  timestamp: new Date().toISOString(),
                },
              });
            }

            webhookData.lastOrdersCount = ordersCount;
          }
          break;
        }

        case 'priceAlert': {
          const tokenAddress = this.getNodeParameter('tokenAddress') as string;
          const priceThreshold = this.getNodeParameter('priceThreshold') as number;
          const triggerDirection = this.getNodeParameter('triggerDirection') as string;

          if (protocolVersion === 'v2') {
            const v2Client = await createGmxV2Client(this as any);
            const price = await v2Client.getOraclePrice(tokenAddress);
            const currentPrice =
              Number((price.min + price.max) / BigInt(2)) / Number(PRECISION);

            const lastPrice = webhookData.lastPrice as number | undefined;
            let triggered = false;

            if (lastPrice !== undefined) {
              if (
                triggerDirection === 'above' &&
                lastPrice <= priceThreshold &&
                currentPrice > priceThreshold
              ) {
                triggered = true;
              } else if (
                triggerDirection === 'below' &&
                lastPrice >= priceThreshold &&
                currentPrice < priceThreshold
              ) {
                triggered = true;
              } else if (triggerDirection === 'cross') {
                if (
                  (lastPrice <= priceThreshold && currentPrice > priceThreshold) ||
                  (lastPrice >= priceThreshold && currentPrice < priceThreshold)
                ) {
                  triggered = true;
                }
              }
            }

            if (triggered) {
              returnData.push({
                json: {
                  triggerType: 'priceAlert',
                  token: tokenAddress,
                  currentPrice,
                  threshold: priceThreshold,
                  direction: currentPrice > priceThreshold ? 'above' : 'below',
                  timestamp: new Date().toISOString(),
                },
              });
            }

            webhookData.lastPrice = currentPrice;
          }
          break;
        }

        case 'liquidationAlert': {
          const accountAddress = this.getNodeParameter('accountAddress') as string;
          const liquidationRiskThreshold = this.getNodeParameter(
            'liquidationRiskThreshold',
          ) as number;

          if (protocolVersion === 'v2') {
            const v2Client = await createGmxV2Client(this as any);
            const positions = await v2Client.getAccountPositions(accountAddress);

            for (const position of positions) {
              const leverage =
                Number(position.sizeInUsd) /
                Number(position.collateralAmount * BigInt(10) ** BigInt(24));
              const riskPercent = Math.min(100, (leverage / 100) * 100);

              if (riskPercent >= liquidationRiskThreshold) {
                returnData.push({
                  json: {
                    triggerType: 'liquidationAlert',
                    account: accountAddress,
                    market: position.market,
                    isLong: position.isLong,
                    sizeInUsd: (Number(position.sizeInUsd) / Number(PRECISION)).toFixed(2),
                    leverage: leverage.toFixed(2),
                    riskPercent: riskPercent.toFixed(2),
                    timestamp: new Date().toISOString(),
                  },
                });
              }
            }
          }
          break;
        }

        case 'newTrade': {
          const accountAddress = this.getNodeParameter('accountAddress') as string;
          const subgraphClient = await createSubgraphClient(this as any);
          const trades = await subgraphClient.getTrades(accountAddress, 10);

          const latestTradeId = trades[0]?.id;
          const lastTradeId = webhookData.lastTradeId as string | undefined;

          if (lastTradeId !== undefined && latestTradeId !== lastTradeId) {
            const newTrades = [];
            for (const trade of trades) {
              if (trade.id === lastTradeId) break;
              newTrades.push(trade);
            }

            if (newTrades.length > 0) {
              returnData.push({
                json: {
                  triggerType: 'newTrade',
                  account: accountAddress,
                  trades: newTrades,
                  tradeCount: newTrades.length,
                  timestamp: new Date().toISOString(),
                },
              });
            }
          }

          webhookData.lastTradeId = latestTradeId;
          break;
        }

        case 'fundingRateChanged': {
          const marketAddress = this.getNodeParameter('marketAddress') as string;
          const fundingRateChangeThreshold = this.getNodeParameter(
            'fundingRateChangeThreshold',
          ) as number;

          const subgraphClient = await createSubgraphClient(this as any);
          const fundingRates = await subgraphClient.getFundingRates(marketAddress, 2);

          if (fundingRates.length >= 2) {
            const currentRate = Number(fundingRates[0].fundingRate);
            const previousRate = Number(fundingRates[1].fundingRate);
            const changePercent = Math.abs(currentRate - previousRate) / Math.abs(previousRate || 1) * 100;

            if (changePercent >= fundingRateChangeThreshold) {
              returnData.push({
                json: {
                  triggerType: 'fundingRateChanged',
                  market: marketAddress,
                  currentRate: currentRate.toString(),
                  previousRate: previousRate.toString(),
                  changePercent: changePercent.toFixed(4),
                  longPayShort: fundingRates[0].longPayShort,
                  timestamp: new Date().toISOString(),
                },
              });
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error(`GMX Trigger error: ${(error as Error).message}`);
    }

    if (returnData.length === 0) {
      return {
        workflowData: [[]],
      };
    }

    return {
      workflowData: [returnData],
    };
  }
}
