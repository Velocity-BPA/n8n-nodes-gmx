/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { BASIS_POINTS_DIVISOR, PRECISION, FUNDING_RATE_PRECISION } from '../constants';

export interface FeeBreakdown {
  positionFee: bigint;
  swapFee: bigint;
  executionFee: bigint;
  fundingFee: bigint;
  borrowingFee: bigint;
  liquidationFee: bigint;
  totalFee: bigint;
  totalFeeUsd: string;
}

export interface FeeRates {
  marginFeeBasisPoints: number;
  swapFeeBasisPoints: number;
  stableSwapFeeBasisPoints: number;
  taxBasisPoints: number;
  stableTaxBasisPoints: number;
  mintBurnFeeBasisPoints: number;
}

/**
 * Calculate position/margin fee
 */
export function calculatePositionFee(
  sizeDelta: bigint,
  marginFeeBasisPoints: number,
): bigint {
  return (sizeDelta * BigInt(marginFeeBasisPoints)) / BigInt(BASIS_POINTS_DIVISOR);
}

/**
 * Calculate swap fee
 */
export function calculateSwapFee(
  amount: bigint,
  isStableSwap: boolean,
  swapFeeBasisPoints: number,
  stableSwapFeeBasisPoints: number,
): bigint {
  const feeBps = isStableSwap ? stableSwapFeeBasisPoints : swapFeeBasisPoints;
  return (amount * BigInt(feeBps)) / BigInt(BASIS_POINTS_DIVISOR);
}

/**
 * Calculate funding fee for V1
 */
export function calculateFundingFeeV1(
  size: bigint,
  entryFundingRate: bigint,
  cumulativeFundingRate: bigint,
): bigint {
  if (size === BigInt(0)) {
    return BigInt(0);
  }

  const fundingRate = cumulativeFundingRate - entryFundingRate;
  return (size * fundingRate) / BigInt(FUNDING_RATE_PRECISION);
}

/**
 * Calculate borrowing fee for V2
 */
export function calculateBorrowingFee(
  sizeInUsd: bigint,
  borrowingFactor: bigint,
  cumulativeBorrowingFactor: bigint,
): bigint {
  if (sizeInUsd === BigInt(0)) {
    return BigInt(0);
  }

  const borrowingDelta = cumulativeBorrowingFactor - borrowingFactor;
  return (sizeInUsd * borrowingDelta) / PRECISION;
}

/**
 * Calculate GLP mint/burn fee
 */
export function calculateMintBurnFee(
  amount: bigint,
  mintBurnFeeBasisPoints: number,
  targetWeight: bigint,
  currentWeight: bigint,
  isIncreasing: boolean,
): bigint {
  // Dynamic fee based on weight deviation
  let feeBps = mintBurnFeeBasisPoints;

  if (targetWeight > BigInt(0)) {
    const weightDeviation = currentWeight > targetWeight
      ? currentWeight - targetWeight
      : targetWeight - currentWeight;

    const deviationBps = Number((weightDeviation * BigInt(BASIS_POINTS_DIVISOR)) / targetWeight);

    // Increase fee if moving away from target, decrease if moving toward target
    const movingTowardTarget = isIncreasing
      ? currentWeight < targetWeight
      : currentWeight > targetWeight;

    if (movingTowardTarget) {
      feeBps = Math.max(0, feeBps - Math.floor(deviationBps / 2));
    } else {
      feeBps = feeBps + Math.floor(deviationBps / 2);
    }
  }

  return (amount * BigInt(feeBps)) / BigInt(BASIS_POINTS_DIVISOR);
}

/**
 * Calculate tax basis points (for dynamic fees)
 */
export function calculateTaxBasisPoints(
  isStable: boolean,
  taxBasisPoints: number,
  stableTaxBasisPoints: number,
): number {
  return isStable ? stableTaxBasisPoints : taxBasisPoints;
}

/**
 * Calculate referral discount
 */
export function calculateReferralDiscount(
  fee: bigint,
  discountBasisPoints: number,
): bigint {
  return (fee * BigInt(discountBasisPoints)) / BigInt(BASIS_POINTS_DIVISOR);
}

/**
 * Calculate fee after referral discount
 */
export function applyReferralDiscount(
  fee: bigint,
  discountBasisPoints: number,
): bigint {
  const discount = calculateReferralDiscount(fee, discountBasisPoints);
  return fee - discount;
}

/**
 * Get complete fee breakdown for a trade
 */
export function calculateTotalFees(params: {
  sizeDelta: bigint;
  swapAmount: bigint;
  isStableSwap: boolean;
  fundingFee: bigint;
  borrowingFee: bigint;
  executionFee: bigint;
  feeRates: FeeRates;
  referralDiscountBps?: number;
}): FeeBreakdown {
  const {
    sizeDelta,
    swapAmount,
    isStableSwap,
    fundingFee,
    borrowingFee,
    executionFee,
    feeRates,
    referralDiscountBps = 0,
  } = params;

  // Calculate position fee
  let positionFee = calculatePositionFee(sizeDelta, feeRates.marginFeeBasisPoints);

  // Calculate swap fee if applicable
  let swapFee = BigInt(0);
  if (swapAmount > BigInt(0)) {
    swapFee = calculateSwapFee(
      swapAmount,
      isStableSwap,
      feeRates.swapFeeBasisPoints,
      feeRates.stableSwapFeeBasisPoints,
    );
  }

  // Apply referral discount to position and swap fees
  if (referralDiscountBps > 0) {
    positionFee = applyReferralDiscount(positionFee, referralDiscountBps);
    swapFee = applyReferralDiscount(swapFee, referralDiscountBps);
  }

  // Calculate total
  const totalFee = positionFee + swapFee + executionFee + fundingFee + borrowingFee;

  return {
    positionFee,
    swapFee,
    executionFee,
    fundingFee,
    borrowingFee,
    liquidationFee: BigInt(0),
    totalFee,
    totalFeeUsd: formatFeeUsd(totalFee),
  };
}

/**
 * Format fee as USD string
 */
export function formatFeeUsd(fee: bigint): string {
  const feeNumber = Number(fee) / Number(PRECISION);
  return `$${feeNumber.toFixed(2)}`;
}

/**
 * Calculate execution fee for V2 orders
 */
export function calculateExecutionFee(
  gasLimit: bigint,
  gasPrice: bigint,
  nativeTokenPrice: bigint,
): bigint {
  const gasCost = gasLimit * gasPrice;
  return (gasCost * nativeTokenPrice) / PRECISION;
}

/**
 * Estimate gas for different order types
 */
export function estimateOrderGas(orderType: string): bigint {
  const gasEstimates: Record<string, bigint> = {
    marketIncrease: BigInt(500000),
    limitIncrease: BigInt(550000),
    marketDecrease: BigInt(550000),
    limitDecrease: BigInt(600000),
    stopLoss: BigInt(600000),
    takeProfit: BigInt(600000),
    swap: BigInt(400000),
    deposit: BigInt(600000),
    withdrawal: BigInt(650000),
  };

  return gasEstimates[orderType] || BigInt(500000);
}

/**
 * Calculate funding APR
 */
export function calculateFundingApr(
  fundingRatePerHour: bigint,
): number {
  // Convert hourly rate to annual percentage
  const hoursPerYear = 24 * 365;
  return Number(fundingRatePerHour * BigInt(hoursPerYear)) / Number(PRECISION) * 100;
}

/**
 * Calculate borrowing APR for V2
 */
export function calculateBorrowingApr(
  borrowingRatePerSecond: bigint,
): number {
  // Convert per-second rate to annual percentage
  const secondsPerYear = 365 * 24 * 60 * 60;
  return Number(borrowingRatePerSecond * BigInt(secondsPerYear)) / Number(PRECISION) * 100;
}
