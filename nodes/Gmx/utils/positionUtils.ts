/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { PRECISION, BASIS_POINTS_DIVISOR, LIQUIDATION_FEE_USD } from '../constants';

export interface PositionParams {
  size: bigint;
  collateral: bigint;
  averagePrice: bigint;
  entryFundingRate: bigint;
  cumulativeFundingRate: bigint;
  isLong: boolean;
  indexPrice: bigint;
}

export interface PnlResult {
  pnl: bigint;
  hasProfit: boolean;
  delta: bigint;
  percentChange: number;
}

export interface LiquidationResult {
  liquidationPrice: bigint;
  isLiquidatable: boolean;
  remainingCollateral: bigint;
  liquidationRisk: number;
}

/**
 * Calculate the position key (unique identifier)
 */
export function getPositionKey(
  account: string,
  collateralToken: string,
  indexToken: string,
  isLong: boolean,
): string {
  const ethers = require('ethers');
  return ethers.solidityPackedKeccak256(
    ['address', 'address', 'address', 'bool'],
    [account, collateralToken, indexToken, isLong],
  );
}

/**
 * Calculate position PnL
 */
export function calculatePnl(params: PositionParams): PnlResult {
  const { size, averagePrice, isLong, indexPrice } = params;

  if (size === BigInt(0) || averagePrice === BigInt(0)) {
    return {
      pnl: BigInt(0),
      hasProfit: false,
      delta: BigInt(0),
      percentChange: 0,
    };
  }

  let delta: bigint;
  let hasProfit: boolean;

  if (isLong) {
    hasProfit = indexPrice > averagePrice;
    delta = hasProfit ? indexPrice - averagePrice : averagePrice - indexPrice;
  } else {
    hasProfit = indexPrice < averagePrice;
    delta = hasProfit ? averagePrice - indexPrice : indexPrice - averagePrice;
  }

  const pnl = (size * delta) / averagePrice;
  const percentChange = Number((delta * BigInt(10000)) / averagePrice) / 100;

  return {
    pnl: hasProfit ? pnl : -pnl,
    hasProfit,
    delta,
    percentChange: hasProfit ? percentChange : -percentChange,
  };
}

/**
 * Calculate funding fee
 */
export function calculateFundingFee(params: PositionParams): bigint {
  const { size, entryFundingRate, cumulativeFundingRate } = params;

  if (size === BigInt(0)) {
    return BigInt(0);
  }

  const fundingRate = cumulativeFundingRate - entryFundingRate;
  return (size * fundingRate) / BigInt(1000000);
}

/**
 * Calculate liquidation price for a position
 */
export function calculateLiquidationPrice(params: {
  size: bigint;
  collateral: bigint;
  averagePrice: bigint;
  isLong: boolean;
  fundingFee: bigint;
  marginFeeBasisPoints: number;
}): LiquidationResult {
  const { size, collateral, averagePrice, isLong, fundingFee, marginFeeBasisPoints } = params;

  if (size === BigInt(0) || averagePrice === BigInt(0)) {
    return {
      liquidationPrice: BigInt(0),
      isLiquidatable: false,
      remainingCollateral: collateral,
      liquidationRisk: 0,
    };
  }

  // Calculate margin fee
  const marginFee = (size * BigInt(marginFeeBasisPoints)) / BigInt(BASIS_POINTS_DIVISOR);

  // Calculate total fees
  const totalFees = marginFee + fundingFee + LIQUIDATION_FEE_USD;

  // Calculate remaining collateral after fees
  const remainingCollateral = collateral > totalFees ? collateral - totalFees : BigInt(0);

  // Calculate liquidation price
  // For longs: liqPrice = entryPrice * (1 - (collateral - fees) / size)
  // For shorts: liqPrice = entryPrice * (1 + (collateral - fees) / size)
  let liquidationPrice: bigint;

  if (isLong) {
    if (remainingCollateral >= size) {
      liquidationPrice = BigInt(0);
    } else {
      const liqPriceDistance = (remainingCollateral * averagePrice) / size;
      liquidationPrice = averagePrice > liqPriceDistance ? averagePrice - liqPriceDistance : BigInt(0);
    }
  } else {
    const liqPriceDistance = (remainingCollateral * averagePrice) / size;
    liquidationPrice = averagePrice + liqPriceDistance;
  }

  // Calculate liquidation risk (0-100)
  const liquidationRisk = remainingCollateral > BigInt(0)
    ? 100 - Number((remainingCollateral * BigInt(100)) / collateral)
    : 100;

  return {
    liquidationPrice,
    isLiquidatable: remainingCollateral <= BigInt(0),
    remainingCollateral,
    liquidationRisk: Math.max(0, Math.min(100, liquidationRisk)),
  };
}

/**
 * Calculate position leverage
 */
export function calculateLeverage(size: bigint, collateral: bigint): number {
  if (collateral === BigInt(0)) {
    return 0;
  }
  return Number((size * BigInt(10000)) / collateral) / 10000;
}

/**
 * Calculate required collateral for a given size and leverage
 */
export function calculateRequiredCollateral(size: bigint, leverage: number): bigint {
  if (leverage <= 0) {
    return size;
  }
  return (size * BigInt(10000)) / BigInt(Math.floor(leverage * 10000));
}

/**
 * Calculate position size from collateral and leverage
 */
export function calculatePositionSize(collateral: bigint, leverage: number): bigint {
  return (collateral * BigInt(Math.floor(leverage * 10000))) / BigInt(10000);
}

/**
 * Validate position parameters
 */
export function validatePosition(params: {
  size: bigint;
  collateral: bigint;
  maxLeverage: number;
  minCollateral: bigint;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { size, collateral, maxLeverage, minCollateral } = params;

  if (size <= BigInt(0)) {
    errors.push('Position size must be greater than 0');
  }

  if (collateral <= BigInt(0)) {
    errors.push('Collateral must be greater than 0');
  }

  if (collateral < minCollateral) {
    errors.push(`Collateral must be at least ${minCollateral.toString()}`);
  }

  const leverage = calculateLeverage(size, collateral);
  if (leverage > maxLeverage) {
    errors.push(`Leverage ${leverage.toFixed(2)}x exceeds maximum ${maxLeverage}x`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate the delta percentage between entry and current price
 */
export function calculateDeltaPercentage(
  entryPrice: bigint,
  currentPrice: bigint,
  isLong: boolean,
): number {
  if (entryPrice === BigInt(0)) {
    return 0;
  }

  const priceDiff = currentPrice > entryPrice
    ? currentPrice - entryPrice
    : entryPrice - currentPrice;
  const isProfit = isLong
    ? currentPrice > entryPrice
    : currentPrice < entryPrice;

  const percentage = Number((priceDiff * BigInt(10000)) / entryPrice) / 100;
  return isProfit ? percentage : -percentage;
}

/**
 * Format position for display
 */
export function formatPositionForDisplay(params: {
  size: bigint;
  collateral: bigint;
  averagePrice: bigint;
  indexPrice: bigint;
  isLong: boolean;
  entryFundingRate: bigint;
  cumulativeFundingRate: bigint;
  marginFeeBasisPoints: number;
  tokenDecimals: number;
  priceDecimals: number;
}): {
  sizeUsd: string;
  collateralUsd: string;
  leverage: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  pnlPercentage: string;
  liquidationPrice: string;
  fundingFee: string;
} {
  const {
    size,
    collateral,
    averagePrice,
    indexPrice,
    isLong,
    entryFundingRate,
    cumulativeFundingRate,
    marginFeeBasisPoints,
    priceDecimals,
  } = params;

  const pnlResult = calculatePnl({
    size,
    collateral,
    averagePrice,
    entryFundingRate,
    cumulativeFundingRate,
    isLong,
    indexPrice,
  });

  const fundingFee = calculateFundingFee({
    size,
    collateral,
    averagePrice,
    entryFundingRate,
    cumulativeFundingRate,
    isLong,
    indexPrice,
  });

  const liquidation = calculateLiquidationPrice({
    size,
    collateral,
    averagePrice,
    isLong,
    fundingFee,
    marginFeeBasisPoints,
  });

  const leverage = calculateLeverage(size, collateral);
  const divisor = BigInt(10) ** BigInt(priceDecimals);

  return {
    sizeUsd: (Number(size) / Number(PRECISION)).toFixed(2),
    collateralUsd: (Number(collateral) / Number(PRECISION)).toFixed(2),
    leverage: `${leverage.toFixed(2)}x`,
    entryPrice: (Number(averagePrice) / Number(divisor)).toFixed(2),
    markPrice: (Number(indexPrice) / Number(divisor)).toFixed(2),
    pnl: `${pnlResult.hasProfit ? '+' : ''}${(Number(pnlResult.pnl) / Number(PRECISION)).toFixed(2)}`,
    pnlPercentage: `${pnlResult.percentChange >= 0 ? '+' : ''}${pnlResult.percentChange.toFixed(2)}%`,
    liquidationPrice: (Number(liquidation.liquidationPrice) / Number(divisor)).toFixed(2),
    fundingFee: (Number(fundingFee) / Number(PRECISION)).toFixed(2),
  };
}
