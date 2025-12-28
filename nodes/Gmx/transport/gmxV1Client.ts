/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers, Contract, JsonRpcProvider, Wallet, formatUnits, parseUnits } from 'ethers';
import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  VAULT_ABI,
  READER_ABI,
  GLP_MANAGER_ABI,
  REWARD_ROUTER_ABI,
  POSITION_ROUTER_ABI,
  ORDER_BOOK_ABI,
  REFERRAL_STORAGE_ABI,
  ERC20_ABI,
  STAKING_TRACKER_ABI,
  VESTER_ABI,
} from '../constants/abis';
import { getContractAddresses } from '../constants/contracts';
import { getNetworkConfig } from '../constants/networks';

export interface GmxV1ClientConfig {
  network: string;
  rpcUrl?: string;
  privateKey?: string;
}

export interface Position {
  size: bigint;
  collateral: bigint;
  averagePrice: bigint;
  entryFundingRate: bigint;
  reserveAmount: bigint;
  realisedPnl: bigint;
  lastIncreasedTime: bigint;
  hasProfit: boolean;
  delta: bigint;
}

export interface GlpInfo {
  price: bigint;
  supply: bigint;
  aum: bigint;
  aumInUsdg: bigint;
}

export interface StakingInfo {
  stakedGmx: bigint;
  stakedEsGmx: bigint;
  stakedGlp: bigint;
  esGmxBalance: bigint;
  multiplierPoints: bigint;
  claimableEth: bigint;
  claimableEsGmx: bigint;
}

/**
 * GMX V1 Client for interacting with GMX V1 contracts (GLP model)
 */
export class GmxV1Client {
  private provider: JsonRpcProvider;
  private signer: Wallet | null = null;
  private network: string;
  private contracts: Record<string, Contract> = {};

  constructor(config: GmxV1ClientConfig) {
    const networkConfig = getNetworkConfig(config.network);
    const rpcUrl = config.rpcUrl || networkConfig.rpcUrl;

    this.provider = new JsonRpcProvider(rpcUrl);
    this.network = config.network;

    if (config.privateKey) {
      this.signer = new Wallet(config.privateKey, this.provider);
    }

    this.initializeContracts();
  }

  private initializeContracts(): void {
    const addresses = getContractAddresses(this.network);
    const signerOrProvider = this.signer || this.provider;

    if (addresses.vault) {
      this.contracts.vault = new Contract(addresses.vault, VAULT_ABI, signerOrProvider);
    }
    if (addresses.reader) {
      this.contracts.reader = new Contract(addresses.reader, READER_ABI, signerOrProvider);
    }
    if (addresses.glpManager) {
      this.contracts.glpManager = new Contract(
        addresses.glpManager,
        GLP_MANAGER_ABI,
        signerOrProvider,
      );
    }
    if (addresses.rewardRouter) {
      this.contracts.rewardRouter = new Contract(
        addresses.rewardRouter,
        REWARD_ROUTER_ABI,
        signerOrProvider,
      );
    }
    if (addresses.positionRouter) {
      this.contracts.positionRouter = new Contract(
        addresses.positionRouter,
        POSITION_ROUTER_ABI,
        signerOrProvider,
      );
    }
    if (addresses.orderBook) {
      this.contracts.orderBook = new Contract(
        addresses.orderBook,
        ORDER_BOOK_ABI,
        signerOrProvider,
      );
    }
    if (addresses.referralStorage) {
      this.contracts.referralStorage = new Contract(
        addresses.referralStorage,
        REFERRAL_STORAGE_ABI,
        signerOrProvider,
      );
    }
    if (addresses.stakedGmxTracker) {
      this.contracts.stakedGmxTracker = new Contract(
        addresses.stakedGmxTracker,
        STAKING_TRACKER_ABI,
        signerOrProvider,
      );
    }
    if (addresses.feeGmxTracker) {
      this.contracts.feeGmxTracker = new Contract(
        addresses.feeGmxTracker,
        STAKING_TRACKER_ABI,
        signerOrProvider,
      );
    }
    if (addresses.gmxVester) {
      this.contracts.gmxVester = new Contract(
        addresses.gmxVester,
        VESTER_ABI,
        signerOrProvider,
      );
    }
  }

  /**
   * Get a position for an account
   */
  async getPosition(
    account: string,
    collateralToken: string,
    indexToken: string,
    isLong: boolean,
  ): Promise<Position> {
    const vault = this.contracts.vault;
    if (!vault) throw new Error('Vault contract not initialized');

    const position = await vault.getPosition(account, collateralToken, indexToken, isLong);

    return {
      size: position[0],
      collateral: position[1],
      averagePrice: position[2],
      entryFundingRate: position[3],
      reserveAmount: position[4],
      realisedPnl: position[5],
      lastIncreasedTime: position[6],
      hasProfit: false,
      delta: BigInt(0),
    };
  }

  /**
   * Get multiple positions for an account
   */
  async getPositions(
    account: string,
    collateralTokens: string[],
    indexTokens: string[],
    isLongs: boolean[],
  ): Promise<bigint[]> {
    const reader = this.contracts.reader;
    const vault = this.contracts.vault;
    if (!reader || !vault) throw new Error('Reader or Vault contract not initialized');

    const positions = await reader.getPositions(
      await vault.getAddress(),
      account,
      collateralTokens,
      indexTokens,
      isLongs,
    );

    return positions;
  }

  /**
   * Get GLP price
   */
  async getGlpPrice(maximize: boolean = true): Promise<bigint> {
    const glpManager = this.contracts.glpManager;
    if (!glpManager) throw new Error('GLP Manager contract not initialized');

    return await glpManager.getPrice(maximize);
  }

  /**
   * Get GLP info including price, supply, and AUM
   */
  async getGlpInfo(): Promise<GlpInfo> {
    const glpManager = this.contracts.glpManager;
    if (!glpManager) throw new Error('GLP Manager contract not initialized');

    const [price, aum, aumInUsdg] = await Promise.all([
      glpManager.getPrice(true),
      glpManager.getAum(true),
      glpManager.getAumInUsdg(true),
    ]);

    const addresses = getContractAddresses(this.network);
    if (!addresses.glp) throw new Error('GLP address not found');

    const glpContract = new Contract(addresses.glp, ERC20_ABI, this.provider);
    const supply = await glpContract.totalSupply();

    return {
      price,
      supply,
      aum,
      aumInUsdg,
    };
  }

  /**
   * Get token price from vault
   */
  async getTokenPrice(token: string, maximize: boolean = true): Promise<bigint> {
    const vault = this.contracts.vault;
    if (!vault) throw new Error('Vault contract not initialized');

    if (maximize) {
      return await vault.getMaxPrice(token);
    } else {
      return await vault.getMinPrice(token);
    }
  }

  /**
   * Get funding rate for a token
   */
  async getFundingRate(token: string): Promise<bigint> {
    const vault = this.contracts.vault;
    if (!vault) throw new Error('Vault contract not initialized');

    return await vault.cumulativeFundingRates(token);
  }

  /**
   * Get next funding rate for a token
   */
  async getNextFundingRate(token: string): Promise<bigint> {
    const vault = this.contracts.vault;
    if (!vault) throw new Error('Vault contract not initialized');

    return await vault.getNextFundingRate(token);
  }

  /**
   * Get pool amount for a token
   */
  async getPoolAmount(token: string): Promise<bigint> {
    const vault = this.contracts.vault;
    if (!vault) throw new Error('Vault contract not initialized');

    return await vault.poolAmounts(token);
  }

  /**
   * Get reserved amount for a token
   */
  async getReservedAmount(token: string): Promise<bigint> {
    const vault = this.contracts.vault;
    if (!vault) throw new Error('Vault contract not initialized');

    return await vault.reservedAmounts(token);
  }

  /**
   * Get global short size for a token
   */
  async getGlobalShortSize(token: string): Promise<bigint> {
    const vault = this.contracts.vault;
    if (!vault) throw new Error('Vault contract not initialized');

    return await vault.globalShortSizes(token);
  }

  /**
   * Get staking info for an account
   */
  async getStakingInfo(account: string): Promise<StakingInfo> {
    const stakedGmxTracker = this.contracts.stakedGmxTracker;
    const feeGmxTracker = this.contracts.feeGmxTracker;

    if (!stakedGmxTracker || !feeGmxTracker) {
      throw new Error('Staking tracker contracts not initialized');
    }

    const addresses = getContractAddresses(this.network);

    const [stakedGmx, claimableEsGmx, claimableEth] = await Promise.all([
      stakedGmxTracker.stakedAmounts(account),
      stakedGmxTracker.claimable(account),
      feeGmxTracker.claimable(account),
    ]);

    // Get esGMX balance
    let esGmxBalance = BigInt(0);
    if (addresses.esGmx) {
      const esGmxContract = new Contract(addresses.esGmx, ERC20_ABI, this.provider);
      esGmxBalance = await esGmxContract.balanceOf(account);
    }

    return {
      stakedGmx,
      stakedEsGmx: BigInt(0), // Would need additional contract calls
      stakedGlp: BigInt(0), // Would need additional contract calls
      esGmxBalance,
      multiplierPoints: BigInt(0), // Would need additional contract calls
      claimableEth,
      claimableEsGmx,
    };
  }

  /**
   * Get referral info for an account
   */
  async getReferralInfo(account: string): Promise<{ code: string; referrer: string }> {
    const referralStorage = this.contracts.referralStorage;
    if (!referralStorage) throw new Error('Referral Storage contract not initialized');

    const [code, referrer] = await referralStorage.getTraderReferralInfo(account);

    return {
      code: ethers.decodeBytes32String(code),
      referrer,
    };
  }

  /**
   * Create increase position request
   */
  async createIncreasePosition(
    path: string[],
    indexToken: string,
    amountIn: bigint,
    minOut: bigint,
    sizeDelta: bigint,
    isLong: boolean,
    acceptablePrice: bigint,
    executionFee: bigint,
    referralCode: string = ethers.ZeroHash,
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const positionRouter = this.contracts.positionRouter;
    if (!positionRouter) throw new Error('Position Router contract not initialized');

    const tx = await positionRouter.createIncreasePosition(
      path,
      indexToken,
      amountIn,
      minOut,
      sizeDelta,
      isLong,
      acceptablePrice,
      executionFee,
      referralCode,
      ethers.ZeroAddress,
      { value: executionFee },
    );

    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Create decrease position request
   */
  async createDecreasePosition(
    path: string[],
    indexToken: string,
    collateralDelta: bigint,
    sizeDelta: bigint,
    isLong: boolean,
    receiver: string,
    acceptablePrice: bigint,
    minOut: bigint,
    executionFee: bigint,
    withdrawETH: boolean = false,
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const positionRouter = this.contracts.positionRouter;
    if (!positionRouter) throw new Error('Position Router contract not initialized');

    const tx = await positionRouter.createDecreasePosition(
      path,
      indexToken,
      collateralDelta,
      sizeDelta,
      isLong,
      receiver,
      acceptablePrice,
      minOut,
      executionFee,
      withdrawETH,
      ethers.ZeroAddress,
      { value: executionFee },
    );

    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Get minimum execution fee for position router
   */
  async getMinExecutionFee(): Promise<bigint> {
    const positionRouter = this.contracts.positionRouter;
    if (!positionRouter) throw new Error('Position Router contract not initialized');

    return await positionRouter.minExecutionFee();
  }

  /**
   * Mint and stake GLP
   */
  async mintAndStakeGlp(
    token: string,
    amount: bigint,
    minUsdg: bigint,
    minGlp: bigint,
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const rewardRouter = this.contracts.rewardRouter;
    if (!rewardRouter) throw new Error('Reward Router contract not initialized');

    const tx = await rewardRouter.mintAndStakeGlp(token, amount, minUsdg, minGlp);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Unstake and redeem GLP
   */
  async unstakeAndRedeemGlp(
    tokenOut: string,
    glpAmount: bigint,
    minOut: bigint,
    receiver: string,
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const rewardRouter = this.contracts.rewardRouter;
    if (!rewardRouter) throw new Error('Reward Router contract not initialized');

    const tx = await rewardRouter.unstakeAndRedeemGlp(tokenOut, glpAmount, minOut, receiver);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Stake GMX
   */
  async stakeGmx(amount: bigint): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const rewardRouter = this.contracts.rewardRouter;
    if (!rewardRouter) throw new Error('Reward Router contract not initialized');

    const tx = await rewardRouter.stakeGmx(amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Unstake GMX
   */
  async unstakeGmx(amount: bigint): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const rewardRouter = this.contracts.rewardRouter;
    if (!rewardRouter) throw new Error('Reward Router contract not initialized');

    const tx = await rewardRouter.unstakeGmx(amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Claim all rewards
   */
  async claimRewards(): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const rewardRouter = this.contracts.rewardRouter;
    if (!rewardRouter) throw new Error('Reward Router contract not initialized');

    const tx = await rewardRouter.claim();
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Compound all rewards
   */
  async compoundRewards(): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const rewardRouter = this.contracts.rewardRouter;
    if (!rewardRouter) throw new Error('Reward Router contract not initialized');

    const tx = await rewardRouter.compound();
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Get token balance
   */
  async getTokenBalance(token: string, account: string): Promise<bigint> {
    const tokenContract = new Contract(token, ERC20_ABI, this.provider);
    return await tokenContract.balanceOf(account);
  }

  /**
   * Get the signer address
   */
  getSignerAddress(): string | null {
    return this.signer ? this.signer.address : null;
  }

  /**
   * Get the provider
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }
}

/**
 * Create a GMX V1 client from n8n credentials
 */
export async function createGmxV1Client(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialName: string = 'gmxNetwork',
): Promise<GmxV1Client> {
  const credentials = await context.getCredentials(credentialName);

  const network = credentials.network as string;
  const rpcUrl = credentials.rpcUrl as string | undefined;
  const privateKey = credentials.privateKey as string | undefined;

  return new GmxV1Client({
    network,
    rpcUrl: rpcUrl || undefined,
    privateKey: privateKey || undefined,
  });
}
