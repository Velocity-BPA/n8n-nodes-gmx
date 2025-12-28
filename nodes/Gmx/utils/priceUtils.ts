/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { PRECISION, PRICE_PRECISION } from '../constants';

export interface PriceInfo {
  min: bigint;
  max: bigint;
  mid: bigint;
  spread: number;
}

/**
 * Calculate the mid price from min and max
 */
export function getMidPrice(minPrice: bigint, maxPrice: bigint): bigint {
  return (minPrice + maxPrice) / BigInt(2);
}

/**
 * Calculate price spread as a percentage
 */
export function getPriceSpread(minPrice: bigint, maxPrice: bigint): number {
  if (minPrice === BigInt(0)) {
    return 0;
  }
  const spread = maxPrice - minPrice;
  return Number((spread * BigInt(10000)) / minPrice) / 100;
}

/**
 * Get complete price info
 */
export function getPriceInfo(minPrice: bigint, maxPrice: bigint): PriceInfo {
  return {
    min: minPrice,
    max: maxPrice,
    mid: getMidPrice(minPrice, maxPrice),
    spread: getPriceSpread(minPrice, maxPrice),
  };
}

/**
 * Convert price to USD value
 */
export function priceToUsd(
  amount: bigint,
  price: bigint,
  tokenDecimals: number,
): bigint {
  return (amount * price) / BigInt(10) ** BigInt(tokenDecimals);
}

/**
 * Convert USD value to token amount
 */
export function usdToTokenAmount(
  usdValue: bigint,
  price: bigint,
  tokenDecimals: number,
): bigint {
  if (price === BigInt(0)) {
    return BigInt(0);
  }
  return (usdValue * BigInt(10) ** BigInt(tokenDecimals)) / price;
}

/**
 * Format price for display
 */
export function formatPrice(price: bigint, decimals: number = 30): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = price / divisor;
  const fractionalPart = price % divisor;

  // Format with 2 decimal places
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 2);
  return `${wholePart}.${fractionalStr}`;
}

/**
 * Parse price string to bigint
 */
export function parsePrice(priceStr: string, decimals: number = 30): bigint {
  const [whole, fraction = ''] = priceStr.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(paddedFraction);
}

/**
 * Calculate acceptable price with slippage
 */
export function calculateAcceptablePrice(
  price: bigint,
  slippageBps: number,
  isLong: boolean,
  isIncrease: boolean,
): bigint {
  const slippageAmount = (price * BigInt(slippageBps)) / BigInt(10000);

  // For long increase or short decrease, we want higher acceptable price (buying)
  // For short increase or long decrease, we want lower acceptable price (selling)
  if ((isLong && isIncrease) || (!isLong && !isIncrease)) {
    return price + slippageAmount;
  } else {
    return price - slippageAmount;
  }
}

/**
 * Calculate price impact
 */
export function calculatePriceImpact(
  sizeDelta: bigint,
  availableLiquidity: bigint,
  impactExponent: number = 2,
  impactFactor: bigint = BigInt(1),
): bigint {
  if (availableLiquidity === BigInt(0)) {
    return BigInt(0);
  }

  // Simple price impact formula: (sizeDelta / liquidity)^exponent * factor
  const ratio = (sizeDelta * PRECISION) / availableLiquidity;
  let impact = ratio;

  for (let i = 1; i < impactExponent; i++) {
    impact = (impact * ratio) / PRECISION;
  }

  return (impact * impactFactor) / PRECISION;
}

/**
 * Get execution price after impact
 */
export function getExecutionPrice(
  basePrice: bigint,
  priceImpact: bigint,
  isLong: boolean,
  isIncrease: boolean,
): bigint {
  // Positive impact is favorable (lower price for buys, higher for sells)
  // Negative impact is unfavorable
  if ((isLong && isIncrease) || (!isLong && !isIncrease)) {
    // Buying: impact increases price
    return basePrice + priceImpact;
  } else {
    // Selling: impact decreases price
    return basePrice > priceImpact ? basePrice - priceImpact : BigInt(0);
  }
}

/**
 * Validate price bounds
 */
export function validatePriceBounds(
  currentPrice: bigint,
  triggerPrice: bigint,
  isAboveThreshold: boolean,
): boolean {
  if (isAboveThreshold) {
    return currentPrice >= triggerPrice;
  } else {
    return currentPrice <= triggerPrice;
  }
}

/**
 * Calculate average entry price after position increase
 */
export function calculateAverageEntryPrice(
  currentSize: bigint,
  currentAveragePrice: bigint,
  sizeDelta: bigint,
  executionPrice: bigint,
): bigint {
  if (currentSize === BigInt(0)) {
    return executionPrice;
  }

  const totalSize = currentSize + sizeDelta;
  if (totalSize === BigInt(0)) {
    return BigInt(0);
  }

  // Weighted average: (currentSize * currentAvgPrice + sizeDelta * execPrice) / totalSize
  const weightedSum =
    (currentSize * currentAveragePrice + sizeDelta * executionPrice) / PRECISION;
  return (weightedSum * PRECISION) / totalSize;
}

/**
 * Convert between different price precisions
 */
export function convertPricePrecision(
  price: bigint,
  fromDecimals: number,
  toDecimals: number,
): bigint {
  if (fromDecimals === toDecimals) {
    return price;
  }

  if (fromDecimals > toDecimals) {
    return price / BigInt(10) ** BigInt(fromDecimals - toDecimals);
  } else {
    return price * BigInt(10) ** BigInt(toDecimals - fromDecimals);
  }
}

/**
 * Get mark price for PnL calculation
 * For longs: use min price (worst case)
 * For shorts: use max price (worst case)
 */
export function getMarkPrice(
  minPrice: bigint,
  maxPrice: bigint,
  isLong: boolean,
  maximize: boolean = false,
): bigint {
  if (isLong) {
    return maximize ? maxPrice : minPrice;
  } else {
    return maximize ? minPrice : maxPrice;
  }
}

/**
 * Calculate the price buffer for limit orders
 */
export function calculatePriceBuffer(
  price: bigint,
  bufferBps: number,
  isAbove: boolean,
): bigint {
  const bufferAmount = (price * BigInt(bufferBps)) / BigInt(10000);
  return isAbove ? price + bufferAmount : price - bufferAmount;
}
