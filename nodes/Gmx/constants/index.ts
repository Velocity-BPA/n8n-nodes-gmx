/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export * from './networks';
export * from './contracts';
export * from './tokens';
export * from './markets';
export * from './abis';

// Common constants
export const PRECISION = BigInt(10) ** BigInt(30);
export const PRICE_PRECISION = BigInt(10) ** BigInt(30);
export const USD_DECIMALS = 30;
export const BASIS_POINTS_DIVISOR = 10000;
export const FUNDING_RATE_PRECISION = 1000000;
export const MAX_LEVERAGE = 100; // 100x
export const MIN_LEVERAGE = 1.1; // 1.1x
export const LIQUIDATION_FEE_USD = BigInt(5) * BigInt(10) ** BigInt(30); // $5

// V2 Order Types
export enum OrderType {
  MarketSwap = 0,
  LimitSwap = 1,
  MarketIncrease = 2,
  LimitIncrease = 3,
  MarketDecrease = 4,
  LimitDecrease = 5,
  StopLossDecrease = 6,
  Liquidation = 7,
}

// V2 Decrease Position Swap Types
export enum DecreasePositionSwapType {
  NoSwap = 0,
  SwapPnlTokenToCollateralToken = 1,
  SwapCollateralTokenToPnlToken = 2,
}

// Position side
export enum PositionSide {
  Long = 'long',
  Short = 'short',
}

// Fee types
export const FEE_TYPES = {
  MARGIN_FEE: 'marginFee',
  SWAP_FEE: 'swapFee',
  POSITION_FEE: 'positionFee',
  FUNDING_FEE: 'fundingFee',
  BORROWING_FEE: 'borrowingFee',
  EXECUTION_FEE: 'executionFee',
  LIQUIDATION_FEE: 'liquidationFee',
} as const;

// Data store keys for V2
export const DATA_STORE_KEYS = {
  ACCOUNT_POSITION_LIST: 'ACCOUNT_POSITION_LIST',
  ACCOUNT_ORDER_LIST: 'ACCOUNT_ORDER_LIST',
  MARKET_LIST: 'MARKET_LIST',
  DEPOSIT_LIST: 'DEPOSIT_LIST',
  WITHDRAWAL_LIST: 'WITHDRAWAL_LIST',
  POSITION_LIST: 'POSITION_LIST',
  ORDER_LIST: 'ORDER_LIST',
  MAX_OPEN_INTEREST: 'MAX_OPEN_INTEREST',
  OPEN_INTEREST: 'OPEN_INTEREST',
  OPEN_INTEREST_IN_TOKENS: 'OPEN_INTEREST_IN_TOKENS',
  POOL_AMOUNT: 'POOL_AMOUNT',
  MAX_POOL_AMOUNT: 'MAX_POOL_AMOUNT',
  RESERVE_FACTOR: 'RESERVE_FACTOR',
  MAX_PNL_FACTOR: 'MAX_PNL_FACTOR',
  FUNDING_FACTOR: 'FUNDING_FACTOR',
  BORROWING_FACTOR: 'BORROWING_FACTOR',
  CUMULATIVE_BORROWING_FACTOR: 'CUMULATIVE_BORROWING_FACTOR',
} as const;

// Subgraph query fragments
export const SUBGRAPH_FRAGMENTS = {
  POSITION_FIELDS: `
    id
    key
    account
    market
    collateralToken
    sizeInUsd
    sizeInTokens
    collateralAmount
    borrowingFactor
    fundingFeeAmountPerSize
    longTokenClaimableFundingAmountPerSize
    shortTokenClaimableFundingAmountPerSize
    increasedAtBlock
    decreasedAtBlock
    isLong
  `,
  ORDER_FIELDS: `
    id
    key
    account
    receiver
    callbackContract
    uiFeeReceiver
    market
    initialCollateralToken
    swapPath
    orderType
    decreasePositionSwapType
    sizeDeltaUsd
    initialCollateralDeltaAmount
    triggerPrice
    acceptablePrice
    executionFee
    callbackGasLimit
    minOutputAmount
    updatedAtBlock
    isLong
    shouldUnwrapNativeToken
    isFrozen
    createdAtBlock
    createdAtTime
  `,
  TRADE_FIELDS: `
    id
    account
    market
    collateralToken
    indexToken
    isLong
    sizeDelta
    collateralDelta
    fee
    pnl
    priceImpact
    timestamp
    txHash
  `,
} as const;
