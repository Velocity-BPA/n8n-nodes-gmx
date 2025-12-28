# n8n-nodes-gmx

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for GMX decentralized perpetuals exchange, providing 9 resource categories and 70+ operations for perpetual trading, liquidity provision, staking, and DeFi analytics on Arbitrum and Avalanche.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

- **Multi-Network Support**: Arbitrum One, Avalanche, and Arbitrum Sepolia testnet
- **Protocol Versions**: Full support for GMX V1 (GLP) and V2 (Synthetics/GM)
- **Position Management**: Open, close, increase, decrease perpetual positions
- **Order Types**: Market, limit, stop-loss, and take-profit orders
- **Liquidity Provision**: GLP minting/redemption (V1) and GM pool deposits/withdrawals (V2)
- **Staking & Rewards**: GMX staking, esGMX management, and reward claiming
- **Real-time Triggers**: Position changes, price alerts, liquidation warnings
- **Comprehensive Analytics**: TVL, volume, open interest, and user statistics

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-gmx`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-gmx

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-gmx.git
cd n8n-nodes-gmx

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-gmx

# Restart n8n
n8n start
```

## Credentials Setup

### GMX Network Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Network | Arbitrum One, Avalanche, or Arbitrum Sepolia | Yes |
| Protocol Version | V1 (GLP) or V2 (Synthetics) | Yes |
| RPC Endpoint URL | Custom RPC endpoint (leave empty for public) | No |
| Private Key | For signing transactions | For trading |
| Subgraph Endpoint | Custom subgraph URL | No |

### GMX API Credentials (Optional)

| Field | Description |
|-------|-------------|
| Stats API Endpoint | GMX Stats API URL |
| Subgraph URL (V1) | The Graph endpoint for V1 |
| Subgraph URL (V2) | The Graph endpoint for V2 |

## Resources & Operations

### Account
- Get Account Overview
- Get Positions
- Get Orders
- Get Trades
- Get PnL
- Get Collateral
- Get Referral Info
- Get Stats

### Position
- Get Positions
- Get Position by Key
- Get Position PnL
- Get Liquidation Price
- Increase Position
- Decrease Position
- Close Position

### Order
- Create Market Order
- Create Limit Order
- Create Stop-Loss Order
- Create Take-Profit Order
- Get Orders
- Get Order
- Cancel Order
- Update Order

### Market
- Get Markets
- Get Market Info
- Get Market Prices
- Get Funding Rate
- Get Open Interest
- Get Available Liquidity
- Get Market Stats
- Get 24h Volume

### GLP (V1 Liquidity)
- Get GLP Price
- Get GLP Stats
- Get GLP Composition
- Get GLP Balance
- Mint GLP
- Redeem GLP
- Get Mint/Redeem Fees

### GM (V2 Liquidity)
- Get GM Pools
- Get GM Pool Info
- Get GM Balance
- Deposit to GM Pool
- Withdraw from GM Pool

### Staking
- Get Staking Info
- Stake GMX
- Unstake GMX
- Claim Rewards
- Compound Rewards
- Get Claimable Rewards

### Analytics
- Get Protocol TVL
- Get Total Volume
- Get Open Interest Stats
- Get Fee Revenue
- Get User Stats
- Get Volume Stats
- Get Subgraph Status

### Utility
- Calculate Position Size
- Calculate Leverage
- Calculate Liquidation Price
- Get Contract Addresses
- Validate Position
- Get Network Info

## Trigger Node

The GMX Trigger node monitors events in real-time:

| Trigger | Description |
|---------|-------------|
| Position Changed | Fires when positions are opened, closed, or modified |
| Order Executed | Fires when orders are filled |
| Price Alert | Fires when price crosses a threshold |
| Liquidation Alert | Fires when position is at liquidation risk |
| New Trade | Fires on new trades for an account |
| Funding Rate Changed | Fires on significant funding rate changes |

## Usage Examples

### Opening a Long Position

```javascript
// Use GMX node with:
// Resource: Position
// Operation: Increase Position
// Market: 0x70d95587d40A2caf56bd97485aB3Eec10Bee6336 (ETH/USD)
// Collateral Token: USDC address
// Is Long: true
// Size (USD): 10000
// Collateral Amount: 1000000000 (1000 USDC in 6 decimals)
// Slippage: 0.5
```

### Setting Up a Stop-Loss

```javascript
// Use GMX node with:
// Resource: Order
// Operation: Create Stop-Loss Order
// Market: ETH/USD market address
// Is Long: true (for existing long position)
// Size (USD): 10000 (full position size to close)
// Trigger Price: $1800 (in 30 decimal precision)
```

### Monitoring Positions

```javascript
// Use GMX Trigger node with:
// Trigger Type: Position Changed
// Account Address: Your wallet address
```

## GMX Concepts

| Term | Description |
|------|-------------|
| GMX | Governance and utility token |
| GLP | V1 liquidity token (multi-asset pool) |
| GM | V2 liquidity tokens (isolated pools) |
| esGMX | Escrowed GMX (staking rewards) |
| Index Token | Underlying asset for perpetuals |
| Collateral Token | Margin asset |
| Funding Rate | Long/short balance payment |
| Borrowing Fee | Cost to hold position (V2) |
| Execution Fee | Keeper gas payment (V2) |
| Mark Price | Fair value for PnL calculation |

## Networks

| Network | Chain ID | V1 Support | V2 Support |
|---------|----------|------------|------------|
| Arbitrum One | 42161 | ✅ | ✅ |
| Avalanche | 43114 | ✅ | ✅ |
| Arbitrum Sepolia | 421614 | ❌ | ✅ |

## Error Handling

The node provides descriptive error messages for common issues:

- **Invalid credentials**: Check your RPC endpoint and private key
- **Insufficient collateral**: Increase collateral or reduce position size
- **Leverage exceeded**: Reduce position size or add collateral
- **Position not found**: Verify market address and position direction
- **Order validation failed**: Check trigger price and size parameters

## Security Best Practices

1. **Never share your private key** - Store securely in n8n credentials
2. **Use testnet first** - Test workflows on Arbitrum Sepolia before mainnet
3. **Set stop-losses** - Protect positions from unexpected liquidation
4. **Monitor leverage** - High leverage increases liquidation risk
5. **Use private RPC endpoints** - Avoid rate limits on public endpoints
6. **Validate positions** - Use utility operations before trading

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Support

- **Documentation**: [GMX Docs](https://docs.gmx.io)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-gmx/issues)
- **Discord**: [n8n Community](https://discord.gg/n8n)

## Acknowledgments

- [GMX](https://gmx.io) - Decentralized perpetuals exchange
- [n8n](https://n8n.io) - Workflow automation platform
- [The Graph](https://thegraph.com) - Indexing protocol for blockchain data
- [ethers.js](https://ethers.org) - Ethereum library
