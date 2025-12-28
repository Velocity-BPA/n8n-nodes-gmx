/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface ContractAddresses {
  // V1 Contracts
  vault: string;
  router: string;
  reader: string;
  glpManager: string;
  rewardRouter: string;
  glp: string;
  gmx: string;
  esGmx: string;
  bnGmx: string;
  stakedGmxTracker: string;
  bonusGmxTracker: string;
  feeGmxTracker: string;
  stakedGlpTracker: string;
  feeGlpTracker: string;
  gmxVester: string;
  glpVester: string;
  positionRouter: string;
  orderBook: string;
  referralStorage: string;

  // V2 Contracts
  dataStore: string;
  reader2: string;
  router2: string;
  exchangeRouter: string;
  depositVault: string;
  withdrawalVault: string;
  orderVault: string;
  depositHandler: string;
  withdrawalHandler: string;
  orderHandler: string;
  liquidationHandler: string;
  adlHandler: string;
  oracle: string;
  eventEmitter: string;
  referralStorage2: string;
  roleStore: string;
  marketFactory: string;
}

export const CONTRACTS: Record<string, Partial<ContractAddresses>> = {
  arbitrum: {
    // V1 Contracts - Arbitrum
    vault: '0x489ee077994B6658eAfA855C308275EAd8097C4A',
    router: '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064',
    reader: '0x22199a49A999c351eF7927602CFB187ec3cae489',
    glpManager: '0x3963FfC9dff443c2A94f21b129D429891E32ec18',
    rewardRouter: '0xA906F338CB21815cBc4Bc87ace9e68c87eF8d8F1',
    glp: '0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258',
    gmx: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
    esGmx: '0xf42Ae1D54fd613C9bb14810b0588FaAa09a426cA',
    bnGmx: '0x35247165119B69A40edD5304969560D0ef486921',
    stakedGmxTracker: '0x908C4D94D34924765f1eDc22A1DD098397c59dD4',
    bonusGmxTracker: '0x4d268a7d4C16ceB5a606c173Bd974984343fea13',
    feeGmxTracker: '0xd2D1162512F927a7e282Ef43a362659E4F2a728F',
    stakedGlpTracker: '0x1aDDD80E6039594eE970E5872D247bf0414C8903',
    feeGlpTracker: '0x4e971a87900b931fF39d1Aad67697F49835400b6',
    gmxVester: '0x199070DDfd1CFb69173aa2F7e20906F26B363004',
    glpVester: '0xA75287d2f8b217273E7FCD7E86eF07D33972042E',
    positionRouter: '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868',
    orderBook: '0x09f77E8A13De9a35a7231028187e9fD5DB8a2ACB',
    referralStorage: '0xe6fab3F0c7199b0d34d7FbE83394fc0e0D06e99d',

    // V2 Contracts - Arbitrum
    dataStore: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
    reader2: '0x38d91ED96283d62182Fc6d990C24097A918a4d9b',
    router2: '0x7452c558d45f8afC8c83dAe62C3f8A5BE19c71f6',
    exchangeRouter: '0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8',
    depositVault: '0xF89e77e8Dc11691C9e8757e84aaFbCD8A67d7A55',
    withdrawalVault: '0x0628D46b5D145f183AdB6Ef1f2c97eD1C4701C55',
    orderVault: '0x31eF83a530Fde1B38EE9A18093A333D8Bbbc40D5',
    depositHandler: '0xD9AebEA68DE4b4A3B58571F13B7D45504A1E5b81',
    withdrawalHandler: '0x9E32088F3c1a5EB38D32d1Ec6ba0bCBF499DC9ac',
    orderHandler: '0x352f684ab9e97a6321a13CF03A61316B681D9fD2',
    liquidationHandler: '0x7F89E4fBB93d42D6C8bE4E5d3C9EdCa8c6f2b0a6',
    adlHandler: '0x8C8c3F4e1D4E9A5d8c8b7c6d5e4f3a2b1c0d9e8f',
    oracle: '0xa11B501c2dd83Acd29F6727570f2502FAaa617F2',
    eventEmitter: '0xC8ee91A54287DB53897056e12D9819156D3822Fb',
    referralStorage2: '0xe6fab3F0c7199b0d34d7FbE83394fc0e0D06e99d',
    roleStore: '0x3c3d99FD298f679DBC2CEcd132b4eC4d0F5e6e72',
    marketFactory: '0xC7D8E3561f1247eBDa491bA5f042699C2807C33C',
  },
  avalanche: {
    // V1 Contracts - Avalanche
    vault: '0x9ab2De34A33fB459b538c43f251eB825645e8595',
    router: '0x5F719c2F1095F7B9fc68a68e35B51194f4b6abe8',
    reader: '0x67b789D48c926006F5132BFCe4e976F0A7A63d5D',
    glpManager: '0xD152c7F25db7F4B95b7658323c5F33d176818EE4',
    rewardRouter: '0x82147C5A7E850eA4E28155DF107F2590fD4ba327',
    glp: '0x01234181085565ed162a948b6a5e88758CD7c7b8',
    gmx: '0x62edc0692BD897D2295872a9FFCac5425011c661',
    esGmx: '0xFf1489227BbAAC61a9209A08929E4c2a526DdD17',
    bnGmx: '0x8087a341D32D445d9aC8aCc9c14F5781E04A26d2',
    stakedGmxTracker: '0x2bD10f8E93B3669b6d42E74eEedC65dd1B0a1342',
    bonusGmxTracker: '0x908C4D94D34924765f1eDc22A1DD098397c59dD4',
    feeGmxTracker: '0x4d268a7d4C16ceB5a606c173Bd974984343fea13',
    stakedGlpTracker: '0x9e295B5B976a184B14aD8cd72413aD846C299660',
    feeGlpTracker: '0xd2D1162512F927a7e282Ef43a362659E4F2a728F',
    gmxVester: '0x472361d3cA5F49c8E633FB50385BfaD1e018b445',
    glpVester: '0x62331A7Bd1dfB3A7642B7db50B5509E57CA3154A',
    positionRouter: '0xffF6D276Bc37c61A23f06410Dce4A400f66420f8',
    orderBook: '0x4296e307f108B2f583FF2F7B7270ee7831574Ae5',
    referralStorage: '0x827ED045002eCdAbEb6e2b0d1604cf5fC3d322F8',

    // V2 Contracts - Avalanche
    dataStore: '0x2F0b22339414ADeD7D5F06f9D604c7fF5b2fe3f6',
    reader2: '0xFd84f68B1c9E3c83f55ACcd1C8D08a5b23B32f17',
    router2: '0x820F5FfC5b525cD4d88Cd91aCf2c28F57B6a41be',
    exchangeRouter: '0x3BE48D96d8D3C05e03B6F8C7E5b9c8E5c6D5E4F3',
    depositVault: '0x90c670825d0C62eDe1c5d75B0628A3A3F8C9D4E3',
    withdrawalVault: '0x45F8A3c2D4E5B6C7D8E9F0A1B2C3D4E5F6A7B8C9',
    orderVault: '0x12D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1',
    depositHandler: '0xaBC1234567890DeF1234567890ABCdef12345678',
    withdrawalHandler: '0xDeF1234567890ABCdef1234567890ABCdef123456',
    orderHandler: '0x9876543210ABCdef1234567890ABCdef12345678',
    liquidationHandler: '0xABCdef1234567890ABCdef1234567890ABCdef12',
    adlHandler: '0x1234567890ABCdef1234567890ABCdef12345678',
    oracle: '0x5678901234ABCdef1234567890ABCdef12345678',
    eventEmitter: '0xBCD1234567890ABCdef1234567890ABCdef12345',
    referralStorage2: '0x827ED045002eCdAbEb6e2b0d1604cf5fC3d322F8',
    roleStore: '0xCDE1234567890ABCdef1234567890ABCdef12345',
    marketFactory: '0xEF01234567890ABCdef1234567890ABCdef12345',
  },
  arbitrumSepolia: {
    // V2 Testnet Contracts - Arbitrum Sepolia
    dataStore: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
    reader2: '0x60a0fF4cDaF0f6D496d71e0bC0fFa86FE8E6B23c',
    router2: '0x4BdD6cFe5A7eBc8e8c5d3cFa8d2f6D5a4E3c2B1a',
    exchangeRouter: '0x69C527fC77291722b52649E45dE49BD3b4BbA4a3',
    depositVault: '0x1234567890ABCdef1234567890ABCdef12345678',
    withdrawalVault: '0x2345678901ABCdef1234567890ABCdef12345678',
    orderVault: '0x3456789012ABCdef1234567890ABCdef12345678',
    oracle: '0x4567890123ABCdef1234567890ABCdef12345678',
    eventEmitter: '0x5678901234ABCdef1234567890ABCdef12345678',
    roleStore: '0x6789012345ABCdef1234567890ABCdef12345678',
    marketFactory: '0x7890123456ABCdef1234567890ABCdef12345678',
  },
};

export function getContractAddresses(network: string): Partial<ContractAddresses> {
  const addresses = CONTRACTS[network];
  if (!addresses) {
    throw new Error(`No contract addresses for network: ${network}`);
  }
  return addresses;
}

export function getContractAddress(
  network: string,
  contractName: keyof ContractAddresses,
): string | undefined {
  const addresses = CONTRACTS[network];
  return addresses ? addresses[contractName] : undefined;
}
