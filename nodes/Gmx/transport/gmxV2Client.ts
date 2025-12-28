/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import {
  DATA_STORE_ABI,
  READER_V2_ABI,
  EXCHANGE_ROUTER_ABI,
  ORACLE_ABI,
  ERC20_ABI,
} from '../constants/abis';
import { getContractAddresses } from '../constants/contracts';
import { getNetworkConfig } from '../constants/networks';
import { OrderType, DecreasePositionSwapType } from '../constants';

export interface GmxV2ClientConfig {
  network: string;
  rpcUrl?: string;
  privateKey?: string;
}

export interface V2Position {
  account: string;
  market: string;
  collateralToken: string;
  isLong: boolean;
  sizeInUsd: bigint;
  sizeInTokens: bigint;
  collateralAmount: bigint;
  borrowingFactor: bigint;
  fundingFeeAmountPerSize: bigint;
  longTokenClaimableFundingAmountPerSize: bigint;
  shortTokenClaimableFundingAmountPerSize: bigint;
  increasedAtBlock: bigint;
  decreasedAtBlock: bigint;
}

export interface V2Order {
  key: string;
  account: string;
  receiver: string;
  callbackContract: string;
  uiFeeReceiver: string;
  market: string;
  initialCollateralToken: string;
  swapPath: string[];
  orderType: number;
  decreasePositionSwapType: number;
  sizeDeltaUsd: bigint;
  initialCollateralDeltaAmount: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  executionFee: bigint;
  callbackGasLimit: bigint;
  minOutputAmount: bigint;
  updatedAtBlock: bigint;
  isLong: boolean;
  shouldUnwrapNativeToken: boolean;
  isFrozen: boolean;
}

export interface V2Market {
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
}

export interface MarketPrice {
  min: bigint;
  max: bigint;
}

export interface CreateOrderParams {
  receiver: string;
  callbackContract: string;
  uiFeeReceiver: string;
  market: string;
  initialCollateralToken: string;
  swapPath: string[];
  sizeDeltaUsd: bigint;
  initialCollateralDeltaAmount: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  executionFee: bigint;
  callbackGasLimit: bigint;
  minOutputAmount: bigint;
  orderType: OrderType;
  decreasePositionSwapType: DecreasePositionSwapType;
  isLong: boolean;
  shouldUnwrapNativeToken: boolean;
  referralCode: string;
  autoCancel: boolean;
}

export interface CreateDepositParams {
  receiver: string;
  callbackContract: string;
  uiFeeReceiver: string;
  market: string;
  initialLongToken: string;
  initialShortToken: string;
  longTokenSwapPath: string[];
  shortTokenSwapPath: string[];
  minMarketTokens: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
}

export interface CreateWithdrawalParams {
  receiver: string;
  callbackContract: string;
  uiFeeReceiver: string;
  market: string;
  longTokenSwapPath: string[];
  shortTokenSwapPath: string[];
  minLongTokenAmount: bigint;
  minShortTokenAmount: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
}

/**
 * GMX V2 Client for interacting with GMX V2/Synthetics contracts (GM model)
 */
export class GmxV2Client {
  private provider: JsonRpcProvider;
  private signer: Wallet | null = null;
  private network: string;
  private contracts: Record<string, Contract> = {};

  constructor(config: GmxV2ClientConfig) {
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

    if (addresses.dataStore) {
      this.contracts.dataStore = new Contract(
        addresses.dataStore,
        DATA_STORE_ABI,
        signerOrProvider,
      );
    }
    if (addresses.reader2) {
      this.contracts.reader = new Contract(addresses.reader2, READER_V2_ABI, signerOrProvider);
    }
    if (addresses.exchangeRouter) {
      this.contracts.exchangeRouter = new Contract(
        addresses.exchangeRouter,
        EXCHANGE_ROUTER_ABI,
        signerOrProvider,
      );
    }
    if (addresses.oracle) {
      this.contracts.oracle = new Contract(addresses.oracle, ORACLE_ABI, signerOrProvider);
    }
  }

  /**
   * Get all markets
   */
  async getMarkets(start: number = 0, end: number = 100): Promise<V2Market[]> {
    const reader = this.contracts.reader;
    const dataStore = this.contracts.dataStore;
    if (!reader || !dataStore) throw new Error('Reader or DataStore contract not initialized');

    const markets = await reader.getMarkets(await dataStore.getAddress(), start, end);

    return markets.map((market: any) => ({
      marketToken: market.marketToken,
      indexToken: market.indexToken,
      longToken: market.longToken,
      shortToken: market.shortToken,
    }));
  }

  /**
   * Get a single market by address
   */
  async getMarket(marketAddress: string): Promise<V2Market> {
    const reader = this.contracts.reader;
    const dataStore = this.contracts.dataStore;
    if (!reader || !dataStore) throw new Error('Reader or DataStore contract not initialized');

    const market = await reader.getMarket(await dataStore.getAddress(), marketAddress);

    return {
      marketToken: market.marketToken,
      indexToken: market.indexToken,
      longToken: market.longToken,
      shortToken: market.shortToken,
    };
  }

  /**
   * Get account positions
   */
  async getAccountPositions(
    account: string,
    start: number = 0,
    end: number = 100,
  ): Promise<V2Position[]> {
    const reader = this.contracts.reader;
    const dataStore = this.contracts.dataStore;
    if (!reader || !dataStore) throw new Error('Reader or DataStore contract not initialized');

    const positions = await reader.getAccountPositions(
      await dataStore.getAddress(),
      account,
      start,
      end,
    );

    return positions.map((pos: any) => ({
      account: pos.addresses.account,
      market: pos.addresses.market,
      collateralToken: pos.addresses.collateralToken,
      isLong: pos.flags.isLong,
      sizeInUsd: pos.numbers.sizeInUsd,
      sizeInTokens: pos.numbers.sizeInTokens,
      collateralAmount: pos.numbers.collateralAmount,
      borrowingFactor: pos.numbers.borrowingFactor,
      fundingFeeAmountPerSize: pos.numbers.fundingFeeAmountPerSize,
      longTokenClaimableFundingAmountPerSize: pos.numbers.longTokenClaimableFundingAmountPerSize,
      shortTokenClaimableFundingAmountPerSize: pos.numbers.shortTokenClaimableFundingAmountPerSize,
      increasedAtBlock: pos.numbers.increasedAtBlock,
      decreasedAtBlock: pos.numbers.decreasedAtBlock,
    }));
  }

  /**
   * Get account orders
   */
  async getAccountOrders(
    account: string,
    start: number = 0,
    end: number = 100,
  ): Promise<V2Order[]> {
    const reader = this.contracts.reader;
    const dataStore = this.contracts.dataStore;
    if (!reader || !dataStore) throw new Error('Reader or DataStore contract not initialized');

    const orders = await reader.getAccountOrders(
      await dataStore.getAddress(),
      account,
      start,
      end,
    );

    return orders.map((order: any) => ({
      key: order.key,
      account: order.addresses.account,
      receiver: order.addresses.receiver,
      callbackContract: order.addresses.callbackContract,
      uiFeeReceiver: order.addresses.uiFeeReceiver,
      market: order.addresses.market,
      initialCollateralToken: order.addresses.initialCollateralToken,
      swapPath: order.addresses.swapPath,
      orderType: order.numbers.orderType,
      decreasePositionSwapType: order.numbers.decreasePositionSwapType,
      sizeDeltaUsd: order.numbers.sizeDeltaUsd,
      initialCollateralDeltaAmount: order.numbers.initialCollateralDeltaAmount,
      triggerPrice: order.numbers.triggerPrice,
      acceptablePrice: order.numbers.acceptablePrice,
      executionFee: order.numbers.executionFee,
      callbackGasLimit: order.numbers.callbackGasLimit,
      minOutputAmount: order.numbers.minOutputAmount,
      updatedAtBlock: order.numbers.updatedAtBlock,
      isLong: order.flags.isLong,
      shouldUnwrapNativeToken: order.flags.shouldUnwrapNativeToken,
      isFrozen: order.flags.isFrozen,
    }));
  }

  /**
   * Get a single order by key
   */
  async getOrder(key: string): Promise<V2Order> {
    const reader = this.contracts.reader;
    const dataStore = this.contracts.dataStore;
    if (!reader || !dataStore) throw new Error('Reader or DataStore contract not initialized');

    const order = await reader.getOrder(await dataStore.getAddress(), key);

    return {
      key: order.key,
      account: order.addresses.account,
      receiver: order.addresses.receiver,
      callbackContract: order.addresses.callbackContract,
      uiFeeReceiver: order.addresses.uiFeeReceiver,
      market: order.addresses.market,
      initialCollateralToken: order.addresses.initialCollateralToken,
      swapPath: order.addresses.swapPath,
      orderType: order.numbers.orderType,
      decreasePositionSwapType: order.numbers.decreasePositionSwapType,
      sizeDeltaUsd: order.numbers.sizeDeltaUsd,
      initialCollateralDeltaAmount: order.numbers.initialCollateralDeltaAmount,
      triggerPrice: order.numbers.triggerPrice,
      acceptablePrice: order.numbers.acceptablePrice,
      executionFee: order.numbers.executionFee,
      callbackGasLimit: order.numbers.callbackGasLimit,
      minOutputAmount: order.numbers.minOutputAmount,
      updatedAtBlock: order.numbers.updatedAtBlock,
      isLong: order.flags.isLong,
      shouldUnwrapNativeToken: order.flags.shouldUnwrapNativeToken,
      isFrozen: order.flags.isFrozen,
    };
  }

  /**
   * Get oracle price for a token
   */
  async getOraclePrice(token: string): Promise<MarketPrice> {
    const oracle = this.contracts.oracle;
    if (!oracle) throw new Error('Oracle contract not initialized');

    const price = await oracle.primaryPrices(token);
    return {
      min: price.min,
      max: price.max,
    };
  }

  /**
   * Create an order (market, limit, stop-loss, take-profit)
   */
  async createOrder(params: CreateOrderParams): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const orderParams = {
      addresses: {
        receiver: params.receiver,
        callbackContract: params.callbackContract,
        uiFeeReceiver: params.uiFeeReceiver,
        market: params.market,
        initialCollateralToken: params.initialCollateralToken,
        swapPath: params.swapPath,
      },
      numbers: {
        sizeDeltaUsd: params.sizeDeltaUsd,
        initialCollateralDeltaAmount: params.initialCollateralDeltaAmount,
        triggerPrice: params.triggerPrice,
        acceptablePrice: params.acceptablePrice,
        executionFee: params.executionFee,
        callbackGasLimit: params.callbackGasLimit,
        minOutputAmount: params.minOutputAmount,
      },
      orderType: {
        orderType: params.orderType,
        decreasePositionSwapType: params.decreasePositionSwapType,
        isLong: params.isLong,
        shouldUnwrapNativeToken: params.shouldUnwrapNativeToken,
        referralCode: params.referralCode,
      },
      autoCancel: params.autoCancel,
    };

    const tx = await exchangeRouter.createOrder(orderParams, { value: params.executionFee });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Update an existing order
   */
  async updateOrder(
    key: string,
    sizeDeltaUsd: bigint,
    acceptablePrice: bigint,
    triggerPrice: bigint,
    minOutputAmount: bigint,
    autoCancel: boolean,
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.updateOrder(
      key,
      sizeDeltaUsd,
      acceptablePrice,
      triggerPrice,
      minOutputAmount,
      autoCancel,
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(key: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.cancelOrder(key);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Create a deposit (add liquidity to GM pool)
   */
  async createDeposit(params: CreateDepositParams): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.createDeposit(params, { value: params.executionFee });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Cancel a deposit
   */
  async cancelDeposit(key: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.cancelDeposit(key);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Create a withdrawal (remove liquidity from GM pool)
   */
  async createWithdrawal(params: CreateWithdrawalParams): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.createWithdrawal(params, { value: params.executionFee });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Cancel a withdrawal
   */
  async cancelWithdrawal(key: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.cancelWithdrawal(key);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Claim funding fees
   */
  async claimFundingFees(
    markets: string[],
    tokens: string[],
    receiver: string,
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.claimFundingFees(markets, tokens, receiver);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Claim affiliate rewards
   */
  async claimAffiliateRewards(
    markets: string[],
    tokens: string[],
    receiver: string,
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized - private key required');

    const exchangeRouter = this.contracts.exchangeRouter;
    if (!exchangeRouter) throw new Error('Exchange Router contract not initialized');

    const tx = await exchangeRouter.claimAffiliateRewards(markets, tokens, receiver);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Get data from data store
   */
  async getDataStoreUint(key: string): Promise<bigint> {
    const dataStore = this.contracts.dataStore;
    if (!dataStore) throw new Error('DataStore contract not initialized');

    return await dataStore.getUint(key);
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

  /**
   * Get the network
   */
  getNetwork(): string {
    return this.network;
  }
}

/**
 * Create a GMX V2 client from n8n credentials
 */
export async function createGmxV2Client(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialName: string = 'gmxNetwork',
): Promise<GmxV2Client> {
  const credentials = await context.getCredentials(credentialName);

  const network = credentials.network as string;
  const rpcUrl = credentials.rpcUrl as string | undefined;
  const privateKey = credentials.privateKey as string | undefined;

  return new GmxV2Client({
    network,
    rpcUrl: rpcUrl || undefined,
    privateKey: privateKey || undefined,
  });
}
