/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { MAX_LEVERAGE, MIN_LEVERAGE, PRECISION, BASIS_POINTS_DIVISOR } from '../constants';

export interface LeverageParams {
  size: bigint;
  collateral: bigint;
  pendingPnl?: bigint;
  pendingFees?: bigint;
}

export interface LeverageResult {
  leverage: number;
  leverageFormatted: string;
  isValid: boolean;
  maxSize: bigint;
  minCollateral: bigint;
}

/**
 * Calculate current leverage
 */
export function calculateLeverage(params: LeverageParams): number {
  const { size, collateral, pendingPnl = BigInt(0), pendingFees = BigInt(0) } = params;

  // Effective collateral = collateral + pnl - fees
  const effectiveCollateral = collateral + pendingPnl - pendingFees;

  if (effectiveCollateral <= BigInt(0)) {
    return Infinity;
  }

  // Leverage = size / effectiveCollateral
  return Number((size * BigInt(10000)) / effectiveCollateral) / 10000;
}

/**
 * Format leverage for display
 */
export function formatLeverage(leverage: number): string {
  if (!isFinite(leverage)) {
    return '∞x';
  }
  return `${leverage.toFixed(2)}x`;
}

/**
 * Validate leverage against limits
 */
export function validateLeverage(
  leverage: number,
  maxLeverage: number = MAX_LEVERAGE,
  minLeverage: number = MIN_LEVERAGE,
): { valid: boolean; error?: string } {
  if (!isFinite(leverage)) {
    return { valid: false, error: 'Invalid leverage (infinite)' };
  }

  if (leverage < minLeverage) {
    return { valid: false, error: `Leverage ${leverage.toFixed(2)}x is below minimum ${minLeverage}x` };
  }

  if (leverage > maxLeverage) {
    return { valid: false, error: `Leverage ${leverage.toFixed(2)}x exceeds maximum ${maxLeverage}x` };
  }

  return { valid: true };
}

/**
 * Get complete leverage info
 */
export function getLeverageInfo(params: LeverageParams, maxLeverage: number = MAX_LEVERAGE): LeverageResult {
  const leverage = calculateLeverage(params);
  const validation = validateLeverage(leverage, maxLeverage);

  // Calculate max size at current collateral and max leverage
  const effectiveCollateral = params.collateral + (params.pendingPnl || BigInt(0)) - (params.pendingFees || BigInt(0));
  const maxSize = effectiveCollateral > BigInt(0)
    ? (effectiveCollateral * BigInt(Math.floor(maxLeverage * 10000))) / BigInt(10000)
    : BigInt(0);

  // Calculate min collateral for current size at max leverage
  const minCollateral = params.size > BigInt(0)
    ? (params.size * BigInt(10000)) / BigInt(Math.floor(maxLeverage * 10000))
    : BigInt(0);

  return {
    leverage,
    leverageFormatted: formatLeverage(leverage),
    isValid: validation.valid,
    maxSize,
    minCollateral,
  };
}

/**
 * Calculate leverage after position modification
 */
export function calculateLeverageAfterChange(
  currentSize: bigint,
  currentCollateral: bigint,
  sizeDelta: bigint,
  collateralDelta: bigint,
  isIncrease: boolean,
): number {
  let newSize: bigint;
  let newCollateral: bigint;

  if (isIncrease) {
    newSize = currentSize + sizeDelta;
    newCollateral = currentCollateral + collateralDelta;
  } else {
    newSize = currentSize > sizeDelta ? currentSize - sizeDelta : BigInt(0);
    newCollateral = currentCollateral > collateralDelta ? currentCollateral - collateralDelta : BigInt(0);
  }

  return calculateLeverage({ size: newSize, collateral: newCollateral });
}

/**
 * Calculate required collateral delta to achieve target leverage
 */
export function calculateCollateralDeltaForTargetLeverage(
  currentSize: bigint,
  currentCollateral: bigint,
  sizeDelta: bigint,
  targetLeverage: number,
  isIncrease: boolean,
): bigint {
  const newSize = isIncrease ? currentSize + sizeDelta : currentSize - sizeDelta;
  const requiredCollateral = (newSize * BigInt(10000)) / BigInt(Math.floor(targetLeverage * 10000));

  if (requiredCollateral > currentCollateral) {
    return requiredCollateral - currentCollateral;
  } else {
    return currentCollateral - requiredCollateral;
  }
}

/**
 * Calculate size delta to achieve target leverage
 */
export function calculateSizeDeltaForTargetLeverage(
  currentSize: bigint,
  currentCollateral: bigint,
  collateralDelta: bigint,
  targetLeverage: number,
  isIncrease: boolean,
): bigint {
  const newCollateral = isIncrease
    ? currentCollateral + collateralDelta
    : currentCollateral - collateralDelta;

  const targetSize = (newCollateral * BigInt(Math.floor(targetLeverage * 10000))) / BigInt(10000);

  if (targetSize > currentSize) {
    return targetSize - currentSize;
  } else {
    return currentSize - targetSize;
  }
}

/**
 * Get leverage tier information
 */
export function getLeverageTier(leverage: number): {
  tier: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  description: string;
} {
  if (leverage <= 2) {
    return {
      tier: 'Conservative',
      riskLevel: 'low',
      description: 'Low leverage, suitable for long-term holding',
    };
  } else if (leverage <= 5) {
    return {
      tier: 'Moderate',
      riskLevel: 'medium',
      description: 'Medium leverage, balanced risk/reward',
    };
  } else if (leverage <= 20) {
    return {
      tier: 'Aggressive',
      riskLevel: 'high',
      description: 'High leverage, increased liquidation risk',
    };
  } else {
    return {
      tier: 'Extreme',
      riskLevel: 'extreme',
      description: 'Very high leverage, extreme liquidation risk',
    };
  }
}

/**
 * Calculate margin ratio
 */
export function calculateMarginRatio(size: bigint, collateral: bigint): number {
  if (size === BigInt(0)) {
    return 1;
  }
  return Number((collateral * BigInt(10000)) / size) / 10000;
}

/**
 * Calculate maintenance margin
 */
export function calculateMaintenanceMargin(
  size: bigint,
  maintenanceMarginBps: number = 100, // 1% default
): bigint {
  return (size * BigInt(maintenanceMarginBps)) / BigInt(BASIS_POINTS_DIVISOR);
}

/**
 * Check if position is under-margined
 */
export function isUnderMargined(
  collateral: bigint,
  size: bigint,
  maintenanceMarginBps: number = 100,
): boolean {
  const maintenanceMargin = calculateMaintenanceMargin(size, maintenanceMarginBps);
  return collateral < maintenanceMargin;
}

/**
 * Calculate safe leverage based on volatility
 */
export function calculateSafeLeverage(
  volatilityPercent: number,
  targetDrawdownPercent: number = 50,
): number {
  // Safe leverage = targetDrawdown / (volatility * some safety factor)
  // This ensures the position can withstand the expected volatility
  if (volatilityPercent <= 0) {
    return MAX_LEVERAGE;
  }

  const safetyFactor = 2; // 2x safety margin
  const safeLeverage = targetDrawdownPercent / (volatilityPercent * safetyFactor);

  return Math.min(Math.max(safeLeverage, MIN_LEVERAGE), MAX_LEVERAGE);
}
