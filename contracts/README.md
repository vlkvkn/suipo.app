# SUI POAP - Smart Contracts

Smart contracts for the SUI POAP application, written in Move language for the SUI blockchain.

## 🚀 Features

- **POAP Issuer**: Contract for creating and managing POAP events
- **NFT Implementation**: Custom NFT contract for POAP tokens
- **Access Control**: Whitelist-based event manager system
- **Secure Minting**: Controlled minting process with unique keys

## 🛠️ Tech Stack

- **Blockchain**: SUI Network
- **Language**: Move
- **Deployment**: SUI CLI

## 📦 Installation

### Prerequisites

- SUI CLI installed and configured
- SUI wallet with testnet/mainnet tokens

### Setup

1. Navigate to the contracts directory:
```bash
cd contracts/poap
```

2. Build the contracts:
```bash
sui move build
```

3. Deploy the contracts:
```bash
sui client publish --gas-budget 10000000
```

## 🔧 Development

### Contract Overview

#### Issuer Contract (`issuer.move`)
- Manages POAP event creation
- Handles event manager whitelisting
- Controls minting permissions
- Stores event metadata

#### NFT Contract (`nft.move`)
- Implements POAP NFT functionality
- Handles token minting
- Manages token metadata
- Provides transfer capabilities

### Key Functions

#### Event Management
- `create_event()` - Create a new POAP event
- `add_manager_to_whitelist()` - Add event manager to whitelist
- `remove_manager_from_whitelist()` - Remove event manager from whitelist

#### POAP Minting
- `mint_poap()` - Mint a POAP NFT for an attendee
- `batch_mint_poap()` - Mint multiple POAPs at once

## 🔒 Security

### Access Control
- Only whitelisted addresses can create events
- Event managers must be explicitly added to whitelist
- Minting requires valid mint keys

### Whitelist Management
After deploying the contracts, you need to add event managers to the whitelist:

```bash
sui client call --package <PACKAGE_ID> --module issuer --function add_manager_to_whitelist --args <EVENT_CONFIG_ID> <SUI_ADDRESS> --gas-budget 100000000
```

**Parameters:**
- `<PACKAGE_ID>`: The package ID returned after contract deployment
- `<EVENT_CONFIG_ID>`: The event configuration object ID
- `<SUI_ADDRESS>`: The SUI address of the event manager to be whitelisted

**Security Note:** Only whitelisted addresses can create and manage events. This ensures that only authorized organizers can distribute POAPs.