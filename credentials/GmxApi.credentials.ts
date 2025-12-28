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

export class GmxApi implements ICredentialType {
  name = 'gmxApi';
  displayName = 'GMX API';
  documentationUrl = 'https://docs.gmx.io';
  properties: INodeProperties[] = [
    {
      displayName: 'Stats API Endpoint',
      name: 'statsApiUrl',
      type: 'string',
      default: 'https://stats.gmx.io',
      description: 'GMX Stats API endpoint for analytics and metrics',
    },
    {
      displayName: 'Subgraph URL (V1)',
      name: 'subgraphV1Url',
      type: 'string',
      default: 'https://api.thegraph.com/subgraphs/name/gmx-io/gmx-stats',
      description: 'The Graph subgraph endpoint for GMX V1 data',
    },
    {
      displayName: 'Subgraph URL (V2/Synthetics)',
      name: 'subgraphV2Url',
      type: 'string',
      default: 'https://api.thegraph.com/subgraphs/name/gmx-io/synthetics-stats',
      description: 'The Graph subgraph endpoint for GMX V2/Synthetics data',
    },
    {
      displayName: 'Arbitrum Subgraph URL',
      name: 'arbitrumSubgraphUrl',
      type: 'string',
      default:
        'https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-arbitrum-stats/api',
      description: 'Arbitrum-specific subgraph endpoint',
    },
    {
      displayName: 'Avalanche Subgraph URL',
      name: 'avalancheSubgraphUrl',
      type: 'string',
      default:
        'https://subgraph.satsuma-prod.com/3b2ced13c8d9/gmx/synthetics-avalanche-stats/api',
      description: 'Avalanche-specific subgraph endpoint',
    },
    {
      displayName: 'API Key (Optional)',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for rate-limited endpoints (if applicable)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.statsApiUrl}}',
      url: '/api/total_volume',
      method: 'GET',
    },
  };
}
