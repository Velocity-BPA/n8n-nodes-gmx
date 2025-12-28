/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class GmxNetwork implements ICredentialType {
  name = 'gmxNetwork';
  displayName = 'GMX Network';
  documentationUrl = 'https://docs.gmx.io';
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      default: 'arbitrum',
      options: [
        {
          name: 'Arbitrum One',
          value: 'arbitrum',
          description: 'GMX V1 + V2 on Arbitrum mainnet',
        },
        {
          name: 'Avalanche',
          value: 'avalanche',
          description: 'GMX V1 on Avalanche C-Chain',
        },
        {
          name: 'Arbitrum Sepolia (Testnet)',
          value: 'arbitrumSepolia',
          description: 'GMX testnet on Arbitrum Sepolia',
        },
        {
          name: 'Custom',
          value: 'custom',
          description: 'Custom RPC endpoint',
        },
      ],
      description: 'The network to connect to',
    },
    {
      displayName: 'Protocol Version',
      name: 'protocolVersion',
      type: 'options',
      default: 'v2',
      options: [
        {
          name: 'V1 (GLP)',
          value: 'v1',
          description: 'GMX V1 with GLP liquidity model',
        },
        {
          name: 'V2 (Synthetics/GM)',
          value: 'v2',
          description: 'GMX V2 with GM isolated pools',
        },
      ],
      description: 'GMX protocol version to use',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://arb1.arbitrum.io/rpc',
      description:
        'Custom RPC endpoint URL. Leave empty to use default public endpoints. Private endpoints recommended for production.',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 42161,
      description: 'Chain ID for the network',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: '0x...',
      description:
        'Private key for signing transactions. Required for trading operations. Keep secure and never share.',
    },
    {
      displayName: 'Subgraph Endpoint (Optional)',
      name: 'subgraphUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.thegraph.com/subgraphs/name/gmx-io/gmx-stats',
      description:
        'Custom subgraph endpoint for analytics queries. Leave empty to use default endpoints.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.network === "custom" ? $credentials.rpcUrl : ($credentials.network === "arbitrum" ? "https://arb1.arbitrum.io/rpc" : ($credentials.network === "avalanche" ? "https://api.avax.network/ext/bc/C/rpc" : "https://sepolia-rollup.arbitrum.io/rpc"))}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
