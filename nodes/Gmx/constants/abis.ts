/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Vault ABI (V1) - Core functions for position management
export const VAULT_ABI = [
  'function getPosition(address _account, address _collateralToken, address _indexToken, bool _isLong) view returns (uint256 size, uint256 collateral, uint256 averagePrice, uint256 entryFundingRate, uint256 reserveAmount, int256 realisedPnl, uint256 lastIncreasedTime)',
  'function getPositionLeverage(address _account, address _collateralToken, address _indexToken, bool _isLong) view returns (uint256)',
  'function liquidatePosition(address _account, address _collateralToken, address _indexToken, bool _isLong, address _feeReceiver)',
  'function getMaxPrice(address _token) view returns (uint256)',
  'function getMinPrice(address _token) view returns (uint256)',
  'function poolAmounts(address _token) view returns (uint256)',
  'function reservedAmounts(address _token) view returns (uint256)',
  'function usdgAmounts(address _token) view returns (uint256)',
  'function tokenWeights(address _token) view returns (uint256)',
  'function totalTokenWeights() view returns (uint256)',
  'function whitelistedTokens(address _token) view returns (bool)',
  'function stableTokens(address _token) view returns (bool)',
  'function getRedemptionAmount(address _token, uint256 _usdgAmount) view returns (uint256)',
  'function getRedemptionCollateral(address _token) view returns (uint256)',
  'function getRedemptionCollateralUsd(address _token) view returns (uint256)',
  'function globalShortSizes(address _token) view returns (uint256)',
  'function globalShortAveragePrices(address _token) view returns (uint256)',
  'function cumulativeFundingRates(address _token) view returns (uint256)',
  'function fundingRateFactor() view returns (uint256)',
  'function stableFundingRateFactor() view returns (uint256)',
  'function getNextFundingRate(address _token) view returns (uint256)',
  'function taxBasisPoints() view returns (uint256)',
  'function stableTaxBasisPoints() view returns (uint256)',
  'function mintBurnFeeBasisPoints() view returns (uint256)',
  'function swapFeeBasisPoints() view returns (uint256)',
  'function stableSwapFeeBasisPoints() view returns (uint256)',
  'function marginFeeBasisPoints() view returns (uint256)',
  'function liquidationFeeUsd() view returns (uint256)',
  'function minProfitTime() view returns (uint256)',
  'function hasDynamicFees() view returns (bool)',
] as const;

// Reader ABI (V1) - Batch read functions
export const READER_ABI = [
  'function getPositions(address _vault, address _account, address[] memory _collateralTokens, address[] memory _indexTokens, bool[] memory _isLong) view returns (uint256[] memory)',
  'function getVaultTokenInfo(address _vault, address _positionManager, address _weth, uint256 _usdgAmount, address[] memory _tokens) view returns (uint256[] memory)',
  'function getVaultTokenInfoV3(address _vault, address _positionManager, address _weth, uint256 _usdgAmount, address[] memory _tokens) view returns (uint256[] memory)',
  'function getVaultTokenInfoV4(address _vault, address _positionManager, address _weth, uint256 _usdgAmount, address[] memory _tokens) view returns (uint256[] memory)',
  'function getFees(address _vault, address[] memory _tokens) view returns (uint256[] memory)',
  'function getTotalStaked(address[] memory _yieldTrackers) view returns (uint256[] memory)',
  'function getStakingInfo(address _account, address[] memory _yieldTrackers) view returns (uint256[] memory)',
  'function getFundingRates(address _vault, address _weth, address[] memory _tokens) view returns (uint256[] memory)',
  'function getTokenBalances(address _account, address[] memory _tokens) view returns (uint256[] memory)',
  'function getTokenBalancesWithSupplies(address _account, address[] memory _tokens) view returns (uint256[] memory)',
] as const;

// GLP Manager ABI
export const GLP_MANAGER_ABI = [
  'function getAum(bool maximise) view returns (uint256)',
  'function getAumInUsdg(bool maximise) view returns (uint256)',
  'function getPrice(bool maximise) view returns (uint256)',
  'function glp() view returns (address)',
  'function cooldownDuration() view returns (uint256)',
  'function lastAddedAt(address _account) view returns (uint256)',
  'function addLiquidity(address _token, uint256 _amount, uint256 _minUsdg, uint256 _minGlp) returns (uint256)',
  'function addLiquidityForAccount(address _fundingAccount, address _account, address _token, uint256 _amount, uint256 _minUsdg, uint256 _minGlp) returns (uint256)',
  'function removeLiquidity(address _tokenOut, uint256 _glpAmount, uint256 _minOut, address _receiver) returns (uint256)',
  'function removeLiquidityForAccount(address _account, address _tokenOut, uint256 _glpAmount, uint256 _minOut, address _receiver) returns (uint256)',
] as const;

// Reward Router ABI (V1 Staking)
export const REWARD_ROUTER_ABI = [
  'function stakeGmx(uint256 _amount)',
  'function stakeEsGmx(uint256 _amount)',
  'function unstakeGmx(uint256 _amount)',
  'function unstakeEsGmx(uint256 _amount)',
  'function claim()',
  'function claimEsGmx()',
  'function claimFees()',
  'function compound()',
  'function handleRewards(bool _shouldClaimGmx, bool _shouldStakeGmx, bool _shouldClaimEsGmx, bool _shouldStakeEsGmx, bool _shouldStakeMultiplierPoints, bool _shouldClaimWeth, bool _shouldConvertWethToEth)',
  'function mintAndStakeGlp(address _token, uint256 _amount, uint256 _minUsdg, uint256 _minGlp) returns (uint256)',
  'function mintAndStakeGlpETH(uint256 _minUsdg, uint256 _minGlp) payable returns (uint256)',
  'function unstakeAndRedeemGlp(address _tokenOut, uint256 _glpAmount, uint256 _minOut, address _receiver) returns (uint256)',
  'function unstakeAndRedeemGlpETH(uint256 _glpAmount, uint256 _minOut, address payable _receiver) returns (uint256)',
] as const;

// Position Router ABI (V1)
export const POSITION_ROUTER_ABI = [
  'function createIncreasePosition(address[] memory _path, address _indexToken, uint256 _amountIn, uint256 _minOut, uint256 _sizeDelta, bool _isLong, uint256 _acceptablePrice, uint256 _executionFee, bytes32 _referralCode, address _callbackTarget) payable returns (bytes32)',
  'function createIncreasePositionETH(address[] memory _path, address _indexToken, uint256 _minOut, uint256 _sizeDelta, bool _isLong, uint256 _acceptablePrice, uint256 _executionFee, bytes32 _referralCode, address _callbackTarget) payable returns (bytes32)',
  'function createDecreasePosition(address[] memory _path, address _indexToken, uint256 _collateralDelta, uint256 _sizeDelta, bool _isLong, address _receiver, uint256 _acceptablePrice, uint256 _minOut, uint256 _executionFee, bool _withdrawETH, address _callbackTarget) payable returns (bytes32)',
  'function executeIncreasePosition(bytes32 _key, address payable _executionFeeReceiver) returns (bool)',
  'function executeDecreasePosition(bytes32 _key, address payable _executionFeeReceiver) returns (bool)',
  'function cancelIncreasePosition(bytes32 _key, address payable _executionFeeReceiver) returns (bool)',
  'function cancelDecreasePosition(bytes32 _key, address payable _executionFeeReceiver) returns (bool)',
  'function minExecutionFee() view returns (uint256)',
  'function getRequestKey(address _account, uint256 _index) view returns (bytes32)',
  'function increasePositionRequestKeysStart() view returns (uint256)',
  'function decreasePositionRequestKeysStart() view returns (uint256)',
  'function increasePositionRequestKeys(uint256 index) view returns (bytes32)',
  'function decreasePositionRequestKeys(uint256 index) view returns (bytes32)',
] as const;

// Order Book ABI (V1)
export const ORDER_BOOK_ABI = [
  'function createIncreaseOrder(address _indexToken, uint256 _amountIn, address _collateralToken, uint256 _sizeDelta, bool _isLong, uint256 _triggerPrice, bool _triggerAboveThreshold, uint256 _executionFee, bool _shouldWrap) payable',
  'function createDecreaseOrder(address _indexToken, uint256 _sizeDelta, address _collateralToken, uint256 _collateralDelta, bool _isLong, uint256 _triggerPrice, bool _triggerAboveThreshold) payable',
  'function createSwapOrder(address[] memory _path, uint256 _amountIn, uint256 _minOut, uint256 _triggerRatio, bool _triggerAboveThreshold, uint256 _executionFee, bool _shouldWrap, bool _shouldUnwrap) payable',
  'function updateIncreaseOrder(uint256 _orderIndex, uint256 _sizeDelta, uint256 _triggerPrice, bool _triggerAboveThreshold)',
  'function updateDecreaseOrder(uint256 _orderIndex, uint256 _collateralDelta, uint256 _sizeDelta, uint256 _triggerPrice, bool _triggerAboveThreshold)',
  'function cancelIncreaseOrder(uint256 _orderIndex)',
  'function cancelDecreaseOrder(uint256 _orderIndex)',
  'function cancelSwapOrder(uint256 _orderIndex)',
  'function executeIncreaseOrder(address _account, uint256 _orderIndex, address payable _feeReceiver)',
  'function executeDecreaseOrder(address _account, uint256 _orderIndex, address payable _feeReceiver)',
  'function executeSwapOrder(address _account, uint256 _orderIndex, address payable _feeReceiver)',
  'function getIncreaseOrder(address _account, uint256 _orderIndex) view returns (address purchaseToken, uint256 purchaseTokenAmount, address collateralToken, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee)',
  'function getDecreaseOrder(address _account, uint256 _orderIndex) view returns (address collateralToken, uint256 collateralDelta, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee)',
  'function getSwapOrder(address _account, uint256 _orderIndex) view returns (address path0, address path1, address path2, uint256 amountIn, uint256 minOut, uint256 triggerRatio, bool triggerAboveThreshold, bool shouldUnwrap, uint256 executionFee)',
  'function increaseOrdersIndex(address account) view returns (uint256)',
  'function decreaseOrdersIndex(address account) view returns (uint256)',
  'function swapOrdersIndex(address account) view returns (uint256)',
  'function minExecutionFee() view returns (uint256)',
] as const;

// Referral Storage ABI
export const REFERRAL_STORAGE_ABI = [
  'function codeOwners(bytes32 _code) view returns (address)',
  'function traderReferralCodes(address _account) view returns (bytes32)',
  'function referrerDiscountShares(address _account) view returns (uint256)',
  'function referrerTiers(address _account) view returns (uint256)',
  'function getTraderReferralInfo(address _account) view returns (bytes32, address)',
  'function setTraderReferralCode(bytes32 _code)',
  'function setTraderReferralCodeByUser(bytes32 _code)',
  'function registerCode(bytes32 _code)',
  'function setCodeOwner(bytes32 _code, address _newAccount)',
  'function govSetCodeOwner(bytes32 _code, address _newAccount)',
  'function setTier(uint256 _tierId, uint256 _totalRebate, uint256 _discountShare)',
  'function setReferrerTier(address _referrer, uint256 _tierId)',
  'function setReferrerDiscountShare(uint256 _discountShare)',
  'function tiers(uint256 _tierId) view returns (uint256 totalRebate, uint256 discountShare)',
] as const;

// V2 Data Store ABI
export const DATA_STORE_ABI = [
  'function getUint(bytes32 key) view returns (uint256)',
  'function getInt(bytes32 key) view returns (int256)',
  'function getAddress(bytes32 key) view returns (address)',
  'function getBool(bytes32 key) view returns (bool)',
  'function getString(bytes32 key) view returns (string memory)',
  'function getBytes32(bytes32 key) view returns (bytes32)',
  'function getUintArray(bytes32 key) view returns (uint256[] memory)',
  'function getIntArray(bytes32 key) view returns (int256[] memory)',
  'function getAddressArray(bytes32 key) view returns (address[] memory)',
  'function getBoolArray(bytes32 key) view returns (bool[] memory)',
  'function containsBytes32(bytes32 setKey, bytes32 value) view returns (bool)',
  'function getBytes32Count(bytes32 setKey) view returns (uint256)',
  'function getBytes32ValuesAt(bytes32 setKey, uint256 start, uint256 end) view returns (bytes32[] memory)',
] as const;

// V2 Reader ABI
export const READER_V2_ABI = [
  'function getMarket(address dataStore, address marketKey) view returns (tuple(address marketToken, address indexToken, address longToken, address shortToken))',
  'function getMarkets(address dataStore, uint256 start, uint256 end) view returns (tuple(address marketToken, address indexToken, address longToken, address shortToken)[] memory)',
  'function getMarketTokenPrice(address dataStore, tuple(address marketToken, address indexToken, address longToken, address shortToken) market, tuple(uint256 min, uint256 max) indexTokenPrice, tuple(uint256 min, uint256 max) longTokenPrice, tuple(uint256 min, uint256 max) shortTokenPrice, bytes32 pnlFactorType, bool maximize) view returns (int256, tuple(int256 poolValue, int256 longPnl, int256 shortPnl, int256 netPnl, uint256 longTokenAmount, uint256 shortTokenAmount, uint256 longTokenUsd, uint256 shortTokenUsd, uint256 totalBorrowingFees, uint256 borrowingFeePoolFactor, uint256 impactPoolAmount))',
  'function getAccountPositions(address dataStore, address account, uint256 start, uint256 end) view returns (tuple(tuple(address account, address market, address collateralToken, bool isLong) addresses, tuple(uint256 sizeInUsd, uint256 sizeInTokens, uint256 collateralAmount, uint256 borrowingFactor, uint256 fundingFeeAmountPerSize, uint256 longTokenClaimableFundingAmountPerSize, uint256 shortTokenClaimableFundingAmountPerSize, uint256 increasedAtBlock, uint256 decreasedAtBlock) numbers, tuple(bool isLong) flags)[] memory)',
  'function getPositionInfo(address dataStore, address referralStorage, bytes32 positionKey, tuple(uint256 min, uint256 max) prices, uint256 sizeDeltaUsd, address uiFeeReceiver, bool usePositionSizeAsSizeDeltaUsd) view returns (tuple(tuple(address account, address market, address collateralToken, bool isLong) addresses, tuple(uint256 sizeInUsd, uint256 sizeInTokens, uint256 collateralAmount, uint256 borrowingFactor, uint256 fundingFeeAmountPerSize, uint256 longTokenClaimableFundingAmountPerSize, uint256 shortTokenClaimableFundingAmountPerSize, uint256 increasedAtBlock, uint256 decreasedAtBlock) numbers, tuple(bool isLong) flags) position, tuple(uint256 borrowingFeeUsd, uint256 borrowingFeeAmount, uint256 borrowingFeeReceiverFactor, uint256 borrowingFeeAmountForFeeReceiver, tuple(int256 fundingFeeAmount, int256 claimableLongTokenAmount, int256 claimableShortTokenAmount, int256 latestFundingFeeAmountPerSize, int256 latestLongTokenClaimableFundingAmountPerSize, int256 latestShortTokenClaimableFundingAmountPerSize) funding, tuple(uint256 positionFeeFactor, uint256 protocolFeeAmount, uint256 positionFeeReceiverFactor, uint256 feeReceiverAmount, uint256 feeAmountForPool, uint256 positionFeeAmountForPool, uint256 positionFeeAmount, uint256 totalCostAmountExcludingFunding, uint256 totalCostAmount) positionFee) fees)',
  'function getAccountOrders(address dataStore, address account, uint256 start, uint256 end) view returns (tuple(tuple(address account, address receiver, address callbackContract, address uiFeeReceiver, address market, address initialCollateralToken, address[] swapPath) addresses, tuple(uint8 orderType, uint8 decreasePositionSwapType, uint256 sizeDeltaUsd, uint256 initialCollateralDeltaAmount, uint256 triggerPrice, uint256 acceptablePrice, uint256 executionFee, uint256 callbackGasLimit, uint256 minOutputAmount, uint256 updatedAtBlock) numbers, tuple(bool isLong, bool shouldUnwrapNativeToken, bool isFrozen) flags, bytes32 key)[] memory)',
  'function getOrder(address dataStore, bytes32 key) view returns (tuple(tuple(address account, address receiver, address callbackContract, address uiFeeReceiver, address market, address initialCollateralToken, address[] swapPath) addresses, tuple(uint8 orderType, uint8 decreasePositionSwapType, uint256 sizeDeltaUsd, uint256 initialCollateralDeltaAmount, uint256 triggerPrice, uint256 acceptablePrice, uint256 executionFee, uint256 callbackGasLimit, uint256 minOutputAmount, uint256 updatedAtBlock) numbers, tuple(bool isLong, bool shouldUnwrapNativeToken, bool isFrozen) flags, bytes32 key))',
] as const;

// V2 Exchange Router ABI
export const EXCHANGE_ROUTER_ABI = [
  'function createOrder(tuple(tuple(address receiver, address callbackContract, address uiFeeReceiver, address market, address initialCollateralToken, address[] swapPath) addresses, tuple(uint256 sizeDeltaUsd, uint256 initialCollateralDeltaAmount, uint256 triggerPrice, uint256 acceptablePrice, uint256 executionFee, uint256 callbackGasLimit, uint256 minOutputAmount) numbers, tuple(uint8 orderType, uint8 decreasePositionSwapType, bool isLong, bool shouldUnwrapNativeToken, bytes32 referralCode) orderType, bool autoCancel) params) payable returns (bytes32)',
  'function updateOrder(bytes32 key, uint256 sizeDeltaUsd, uint256 acceptablePrice, uint256 triggerPrice, uint256 minOutputAmount, bool autoCancel) payable',
  'function cancelOrder(bytes32 key) payable',
  'function createDeposit(tuple(address receiver, address callbackContract, address uiFeeReceiver, address market, address initialLongToken, address initialShortToken, address[] longTokenSwapPath, address[] shortTokenSwapPath, uint256 minMarketTokens, bool shouldUnwrapNativeToken, uint256 executionFee, uint256 callbackGasLimit) params) payable returns (bytes32)',
  'function cancelDeposit(bytes32 key) payable',
  'function createWithdrawal(tuple(address receiver, address callbackContract, address uiFeeReceiver, address market, address[] longTokenSwapPath, address[] shortTokenSwapPath, uint256 minLongTokenAmount, uint256 minShortTokenAmount, bool shouldUnwrapNativeToken, uint256 executionFee, uint256 callbackGasLimit) params) payable returns (bytes32)',
  'function cancelWithdrawal(bytes32 key) payable',
  'function claimFundingFees(address[] memory markets, address[] memory tokens, address receiver) payable returns (uint256[] memory)',
  'function claimCollateral(address[] memory markets, address[] memory tokens, uint256[] memory timeKeys, address receiver) payable returns (uint256[] memory)',
  'function claimAffiliateRewards(address[] memory markets, address[] memory tokens, address receiver) payable returns (uint256[] memory)',
  'function setSavedCallbackContract(address market, address callbackContract)',
] as const;

// V2 Oracle ABI
export const ORACLE_ABI = [
  'function primaryPrices(address token) view returns (uint256 min, uint256 max)',
  'function secondaryPrices(address token) view returns (uint256 min, uint256 max)',
  'function getLatestPrice(address token) view returns (uint256)',
  'function getPrimaryPrice(address token) view returns (tuple(uint256 min, uint256 max))',
  'function getStablePrice(address dataStore, address token) view returns (uint256)',
] as const;

// ERC20 ABI
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
] as const;

// Staking Tracker ABI
export const STAKING_TRACKER_ABI = [
  'function stakedAmounts(address _account) view returns (uint256)',
  'function depositBalances(address _account, address _depositToken) view returns (uint256)',
  'function claimable(address _account) view returns (uint256)',
  'function cumulativeRewards(address _account) view returns (uint256)',
  'function averageStakedAmounts(address _account) view returns (uint256)',
  'function tokensPerInterval() view returns (uint256)',
  'function totalDepositSupply(address _depositToken) view returns (uint256)',
] as const;

// Vester ABI
export const VESTER_ABI = [
  'function deposit(uint256 _amount)',
  'function withdraw()',
  'function claim() returns (uint256)',
  'function claimable(address _account) view returns (uint256)',
  'function cumulativeClaimAmounts(address _account) view returns (uint256)',
  'function claimedAmounts(address _account) view returns (uint256)',
  'function pairAmounts(address _account) view returns (uint256)',
  'function getVestedAmount(address _account) view returns (uint256)',
  'function getTotalVested(address _account) view returns (uint256)',
  'function getMaxVestableAmount(address _account) view returns (uint256)',
  'function getCombinedAverageStakedAmount(address _account) view returns (uint256)',
  'function balanceOf(address _account) view returns (uint256)',
  'function vestingDuration() view returns (uint256)',
] as const;

// Export all ABIs as a collection
export const ABIS = {
  vault: VAULT_ABI,
  reader: READER_ABI,
  glpManager: GLP_MANAGER_ABI,
  rewardRouter: REWARD_ROUTER_ABI,
  positionRouter: POSITION_ROUTER_ABI,
  orderBook: ORDER_BOOK_ABI,
  referralStorage: REFERRAL_STORAGE_ABI,
  dataStore: DATA_STORE_ABI,
  readerV2: READER_V2_ABI,
  exchangeRouter: EXCHANGE_ROUTER_ABI,
  oracle: ORACLE_ABI,
  erc20: ERC20_ABI,
  stakingTracker: STAKING_TRACKER_ABI,
  vester: VESTER_ABI,
} as const;
