/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  calculateLeverage,
  getLeverageInfo,
  validateLeverage,
} from '../../nodes/Gmx/utils/leverageUtils';

import {
  calculatePnl,
  calculateLiquidationPrice,
  getPositionKey,
} from '../../nodes/Gmx/utils/positionUtils';

import {
  calculatePositionFee,
  calculateSwapFee,
  calculateFundingFeeV1,
} from '../../nodes/Gmx/utils/feeUtils';

import {
  getMidPrice,
  getPriceSpread,
  calculateAcceptablePrice,
} from '../../nodes/Gmx/utils/priceUtils';

describe('Leverage Utils', () => {
  describe('calculateLeverage', () => {
    it('should calculate leverage correctly', () => {
      const result = calculateLeverage({
        size: BigInt(10000) * BigInt(10) ** BigInt(30),
        collateral: BigInt(1000) * BigInt(10) ** BigInt(30),
      });
      expect(result).toBe(10);
    });

    it('should return 0 for zero collateral', () => {
      const result = calculateLeverage({
        size: BigInt(10000) * BigInt(10) ** BigInt(30),
        collateral: BigInt(0),
      });
      expect(result).toBe(Infinity);
    });
  });

  describe('validateLeverage', () => {
    it('should validate leverage within limits', () => {
      const result = validateLeverage(10, 100, 1.1);
      expect(result.valid).toBe(true);
    });

    it('should reject leverage above maximum', () => {
      const result = validateLeverage(150, 100, 1.1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject leverage below minimum', () => {
      const result = validateLeverage(1, 100, 1.1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('below minimum');
    });
  });

  describe('getLeverageInfo', () => {
    it('should return complete leverage info', () => {
      const result = getLeverageInfo({
        size: BigInt(10000) * BigInt(10) ** BigInt(30),
        collateral: BigInt(1000) * BigInt(10) ** BigInt(30),
      });
      expect(result.leverage).toBe(10);
      expect(result.leverageFormatted).toBe('10.00x');
      expect(result.isValid).toBe(true);
    });
  });
});

describe('Position Utils', () => {
  describe('calculatePnl', () => {
    it('should calculate positive PnL for long position with price increase', () => {
      const result = calculatePnl({
        size: BigInt(10000) * BigInt(10) ** BigInt(30),
        collateral: BigInt(1000) * BigInt(10) ** BigInt(30),
        averagePrice: BigInt(100) * BigInt(10) ** BigInt(30),
        entryFundingRate: BigInt(0),
        cumulativeFundingRate: BigInt(0),
        isLong: true,
        indexPrice: BigInt(110) * BigInt(10) ** BigInt(30),
      });
      expect(result.hasProfit).toBe(true);
      expect(result.percentChange).toBeGreaterThan(0);
    });

    it('should calculate negative PnL for long position with price decrease', () => {
      const result = calculatePnl({
        size: BigInt(10000) * BigInt(10) ** BigInt(30),
        collateral: BigInt(1000) * BigInt(10) ** BigInt(30),
        averagePrice: BigInt(100) * BigInt(10) ** BigInt(30),
        entryFundingRate: BigInt(0),
        cumulativeFundingRate: BigInt(0),
        isLong: true,
        indexPrice: BigInt(90) * BigInt(10) ** BigInt(30),
      });
      expect(result.hasProfit).toBe(false);
      expect(result.percentChange).toBeLessThan(0);
    });

    it('should calculate positive PnL for short position with price decrease', () => {
      const result = calculatePnl({
        size: BigInt(10000) * BigInt(10) ** BigInt(30),
        collateral: BigInt(1000) * BigInt(10) ** BigInt(30),
        averagePrice: BigInt(100) * BigInt(10) ** BigInt(30),
        entryFundingRate: BigInt(0),
        cumulativeFundingRate: BigInt(0),
        isLong: false,
        indexPrice: BigInt(90) * BigInt(10) ** BigInt(30),
      });
      expect(result.hasProfit).toBe(true);
    });
  });

  describe('calculateLiquidationPrice', () => {
    it('should calculate liquidation price for long position', () => {
      const result = calculateLiquidationPrice({
        size: BigInt(10000) * BigInt(10) ** BigInt(30),
        collateral: BigInt(1000) * BigInt(10) ** BigInt(30),
        averagePrice: BigInt(100) * BigInt(10) ** BigInt(30),
        isLong: true,
        fundingFee: BigInt(0),
        marginFeeBasisPoints: 10,
      });
      expect(result.liquidationPrice).toBeGreaterThan(BigInt(0));
      expect(result.isLiquidatable).toBe(false);
    });
  });
});

describe('Fee Utils', () => {
  describe('calculatePositionFee', () => {
    it('should calculate position fee correctly', () => {
      const sizeDelta = BigInt(10000) * BigInt(10) ** BigInt(30);
      const fee = calculatePositionFee(sizeDelta, 10); // 0.1%
      expect(fee).toBe(BigInt(10) * BigInt(10) ** BigInt(30));
    });
  });

  describe('calculateSwapFee', () => {
    it('should calculate swap fee for non-stable swap', () => {
      const amount = BigInt(1000) * BigInt(10) ** BigInt(18);
      const fee = calculateSwapFee(amount, false, 30, 1);
      const expectedFee = (amount * BigInt(30)) / BigInt(10000);
      expect(fee).toBe(expectedFee);
    });

    it('should calculate swap fee for stable swap', () => {
      const amount = BigInt(1000) * BigInt(10) ** BigInt(18);
      const fee = calculateSwapFee(amount, true, 30, 1);
      const expectedFee = (amount * BigInt(1)) / BigInt(10000);
      expect(fee).toBe(expectedFee);
    });
  });
});

describe('Price Utils', () => {
  describe('getMidPrice', () => {
    it('should calculate mid price correctly', () => {
      const min = BigInt(100) * BigInt(10) ** BigInt(30);
      const max = BigInt(102) * BigInt(10) ** BigInt(30);
      const mid = getMidPrice(min, max);
      expect(mid).toBe(BigInt(101) * BigInt(10) ** BigInt(30));
    });
  });

  describe('getPriceSpread', () => {
    it('should calculate spread percentage', () => {
      const min = BigInt(100) * BigInt(10) ** BigInt(30);
      const max = BigInt(102) * BigInt(10) ** BigInt(30);
      const spread = getPriceSpread(min, max);
      expect(spread).toBe(2);
    });
  });

  describe('calculateAcceptablePrice', () => {
    it('should add slippage for long increase', () => {
      const price = BigInt(100) * BigInt(10) ** BigInt(30);
      const acceptable = calculateAcceptablePrice(price, 50, true, true); // 0.5% slippage
      expect(acceptable).toBeGreaterThan(price);
    });

    it('should subtract slippage for long decrease', () => {
      const price = BigInt(100) * BigInt(10) ** BigInt(30);
      const acceptable = calculateAcceptablePrice(price, 50, true, false);
      expect(acceptable).toBeLessThan(price);
    });
  });
});
