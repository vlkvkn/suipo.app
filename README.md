# SUI POAP - Proof of Attendance Protocol

🌐 **Project Website**: [suipo.app](https://suipo.app)

A decentralized application (dApp) built on the SUI blockchain that allows users to create events and mint POAP (Proof of Attendance Protocol) NFTs for event attendees.

## 🚀 Features

- **POAP Minting**: Mint unique NFTs for event attendees
- **Event Creation**: Create events with detailed information including name, description, image URL, and expiration date
- **Blockchain Storage**: All event data and POAPs are stored on the SUI blockchain


## 📦 Installation

### Configure frontend

Navigate to the frontend directory and install dependencies:

```bash
cd client_web
npm install
```

Update the configuration in `src/config/index.ts` with your deployed contract addresses:

```typescript
export const PACKAGE_ID = "YOUR_PACKAGE_ID";
export const EVENT_CONFIG_ID = "YOUR_EVENT_CONFIG_ID";
```

Create a `.env` file in the suipo.app directory. See `.env.example` for reference.

```bash
npm dev
```

The application will be available at `http://localhost:5173`

## 🎯 Usage

### Creating Events

1. Connect your SUI wallet using the "Connect Wallet" button
2. Navigate to the Event Manager page (`/eventmanager`)
3. Fill in the event details
4. Click "Create Event" to deploy the event to the blockchain

### Minting POAPs

1. Navigate to the Home page
2. Select an event from the list
3. Click "Mint POAP" to create a unique NFT for the event
4. Confirm the transaction in your wallet


Built with ❤️ on the SUI blockchain 